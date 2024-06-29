import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './init/firebase';

export interface PlaceDetails {
  name: string;
  address: string;
  photoUrl: string | null;
}

export interface SaveMapLinkParams {
  userId: string;
  groupId: string;
  link: string;
  placeDetails: PlaceDetails;
}

export const saveMapLink = async ({ userId, groupId, link, placeDetails }: SaveMapLinkParams): Promise<void> => {
  try {
    // Firestoreに保存するデータを作成
    const linkData = {
      userId,
      groupId: groupId || '',
      link,
      name: placeDetails.name,
      address: placeDetails.address,
      photoUrl: placeDetails.photoUrl,
      timestamp: serverTimestamp()
    };

    // Firestoreに保存
    await addDoc(collection(db, 'Links'), linkData);

    console.log('Link and place details saved to Firestore');
  } catch (error) {
    console.error('Error saving link and place details to Firestore', error);
    throw error;
  }
};