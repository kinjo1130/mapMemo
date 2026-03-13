import { collection, addDoc, serverTimestamp, updateDoc, doc, runTransaction, arrayUnion } from 'firebase/firestore';
import { db } from './init/firebase';
import { SaveMapLinkParams } from '@/types/Link';
import { generateTagsFromTypes } from './placeTypeLabels';

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

    // Firestoreに保存するデータを作成
    const linkData = {
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
      groupPictureUrl,
      categories: placeDetails.categories || [],
      tags: generateTagsFromTypes(placeDetails.categories || []),
      placeId: placeDetails.placeId || '',
      rating: placeDetails.rating ?? null,
      userRatingsTotal: placeDetails.userRatingsTotal ?? null,
      priceLevel: placeDetails.priceLevel ?? null,
      openingHours: placeDetails.openingHours ?? null,
      website: placeDetails.website ?? null,
      phoneNumber: placeDetails.phoneNumber ?? null,
      googleMapsUrl: placeDetails.googleMapsUrl ?? null,
      businessStatus: placeDetails.businessStatus ?? null,
      editorialSummary: placeDetails.editorialSummary ?? null,
    };

    // Firestoreに保存
    const docRef = await addDoc(collection(db, 'Links'), linkData);

    // ドキュメントIDを取得してデータに追加
    await updateDoc(doc(db, 'Links', docRef.id), {
      docId: docRef.id
    });

    // usersコレクションに所属しているGroupIdを更新
    if (groupId) {
      const userRef = doc(db, 'users', userId);
      await runTransaction(db, async (transaction) => {
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
      });
    }

    console.log('Link and place details saved to Firestore with document ID');
  } catch (error) {
    console.error('Error saving link and place details to Firestore', error);
    throw error;
  }
};
