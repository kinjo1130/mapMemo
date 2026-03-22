import { saveLineImageToStorage } from './Storage/saveLineImage';
import { getCurrentUser } from './User/getCurrentUser';
import { getJoinGroupInfo } from './Group/getJoinGroupInfo';
import { collection, addDoc, serverTimestamp, updateDoc, doc, runTransaction, arrayUnion } from 'firebase/firestore';
import { db } from './init/firebase';

type SaveImagePostParams = {
  messageId: string;
  userId: string;
  groupId?: string;
};

type SaveImagePostResult = {
  success: boolean;
  imageUrl?: string;
  error?: string;
};

export async function saveImagePost(
  params: SaveImagePostParams
): Promise<SaveImagePostResult> {
  const { messageId, userId, groupId } = params;

  if (!messageId || !userId) {
    return { success: false, error: 'messageId and userId are required' };
  }

  try {
    // LINE から画像を取得して Firebase Storage に保存
    const imageUrl = await saveLineImageToStorage(messageId, userId);

    // ユーザー情報を取得
    const currentUser = await getCurrentUser(userId);

    // グループ情報を取得
    let groupData = null;
    if (groupId) {
      groupData = await getJoinGroupInfo(groupId, userId);
    }

    // Firestore に保存
    const linkData = {
      userId,
      groupId: groupId || '',
      link: '',
      name: '投稿画像',
      address: '',
      photoUrl: imageUrl,
      timestamp: serverTimestamp(),
      lat: null,
      lng: null,
      isPersonal: !groupId,
      displayName: currentUser?.displayName || '',
      userPictureUrl: currentUser?.pictureUrl || '',
      groupName: groupData?.groupName || '',
      members: groupData?.members || [],
      groupPictureUrl: groupData?.pictureUrl || '',
      type: 'image',
    };

    const docRef = await addDoc(collection(db, 'Links'), linkData);
    await updateDoc(doc(db, 'Links', docRef.id), { docId: docRef.id });

    // グループに所属情報を更新
    if (groupId) {
      const userRef = doc(db, 'users', userId);
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('ユーザードキュメントが存在しません');
        }
        const userData = userDoc.data();
        const joinedGroups = userData.isJoinedGroups || [];
        if (!joinedGroups.includes(groupId)) {
          transaction.update(userRef, {
            isJoinedGroups: arrayUnion(groupId),
          });
        }
      });
    }

    return { success: true, imageUrl };
  } catch (error) {
    console.error('Error saving image post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
