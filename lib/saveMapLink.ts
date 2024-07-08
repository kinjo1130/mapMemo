import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
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
      groupPictureUrl
    };

    // Firestoreに保存
    const docRef = await addDoc(collection(db, 'Links'), linkData);

    // ドキュメントIDを取得してデータに追加
    await updateDoc(doc(db, 'Links', docRef.id), {
      docId: docRef.id
    });

    console.log('Link and place details saved to Firestore with document ID');
  } catch (error) {
    console.error('Error saving link and place details to Firestore', error);
    throw error;
  }
};
