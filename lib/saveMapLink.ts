import { collection, serverTimestamp, doc, setDoc, runTransaction, arrayUnion } from 'firebase/firestore';
import { db } from './init/firebase';
import { SaveMapLinkParams } from '@/types/Link';

export const saveMapLink = async (params: SaveMapLinkParams): Promise<void> => {
  try {
    const {
      userId,
      groupId,
      link,
      placeDetails,
      displayName,
      userPictureUrl,
      groupName,
      members,
      groupPictureUrl
    } = params;

    // IDを事前生成して1回のsetDocで保存
    const newDocRef = doc(collection(db, 'Links'));

    const linkData = {
      docId: newDocRef.id,
      userId,
      groupId: groupId || '',
      link,
      name: placeDetails.name,
      address: placeDetails.address,
      photoUrl: placeDetails.photoUrl,
      timestamp: serverTimestamp(),
      lat: placeDetails.latitude,
      lng: placeDetails.longitude,
      isPersonal: !groupId,
      displayName,
      userPictureUrl,
      groupName,
      members,
      groupPictureUrl
    };

    // Firestore保存とグループ更新を並列化
    const promises: Promise<void>[] = [setDoc(newDocRef, linkData)];

    if (groupId) {
      const userRef = doc(db, 'users', userId);
      promises.push(
        runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);

          if (!userDoc.exists()) {
            throw new Error("ユーザードキュメントが存在しません");
          }

          const userData = userDoc.data();
          const joinedGroups = userData.isJoinedGroups || [];

          if (!joinedGroups.includes(groupId)) {
            transaction.update(userRef, {
              isJoinedGroups: arrayUnion(groupId)
            });
          }
        })
      );
    }

    await Promise.all(promises);

    console.log('Link and place details saved to Firestore with document ID');
  } catch (error) {
    console.error('Error saving link and place details to Firestore', error);
    throw error;
  }
};
