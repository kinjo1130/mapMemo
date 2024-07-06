import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from './init/firebase';
import { Link } from '@/types/Link';

export interface PlaceDetails {
  name: string;
  address: string;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
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
      timestamp: serverTimestamp(),
      lat: placeDetails.latitude,
      lng: placeDetails.longitude,
      isPersonal: !groupId // groupIdが空文字列の場合は個人のリンクとして扱う
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