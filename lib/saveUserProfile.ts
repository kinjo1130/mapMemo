// lib/saveUserProfile.ts
import { db } from './init/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Profile } from '@line/bot-sdk';

export const saveUserProfile = async (profile: Profile): Promise<void> => {
  try {
    const userRef = doc(collection(db, 'users'), profile.userId);
    await setDoc(userRef, {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || '',
      statusMessage: profile.statusMessage || '',
      period: {
        startDate: null,
        endDate: null
      }
    }, { merge: true });
    console.log(`User profile saved: ${profile.displayName}`);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};
