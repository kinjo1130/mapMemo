import { db } from './init/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export interface UserPeriod {
  userId: string;
  startDate?: string;
  endDate?: string;
}

export const saveUserPeriod = async (userPeriod: UserPeriod): Promise<void> => {
  try {
    const userRef = doc(collection(db, 'users'), userPeriod.userId);
    await setDoc(userRef, { period: userPeriod }, { merge: true });
    console.log(`User period saved: ${userPeriod.userId}`);
  } catch (error) {
    console.error('Error saving user period:', error);
    throw new Error('Unable to save period. Please try again.');
  }
};
