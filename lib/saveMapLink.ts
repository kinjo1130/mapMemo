// lib/saveMapLink.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './init/firebase';

export interface SaveMapLinkParams {
  userId: string;
  groupId: string;
  link: string;
}

export const saveMapLink = async ({ userId, groupId, link }: SaveMapLinkParams): Promise<void> => {
  try {
    await addDoc(collection(db, 'Links'), {
      userId,
      groupId: groupId || '',
      link,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving link to Firestore', error);
    throw error;
  }
};
