import { db } from '../init/firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface UserPeriod {
  userId: string;
  startDate?: string | null;
  endDate?: string | null;
}

export const saveUserPeriod = async (userPeriod: UserPeriod): Promise<void> => {
  const { userId, startDate, endDate } = userPeriod;

  // undefinedをnullに変換
  const periodData = {
    userId,
    startDate: startDate || null,
    endDate: endDate || null
  };

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { period: periodData }, { merge: true });
  } catch (error) {
    console.error('Error saving user period:', error);
    throw error;
  }
};
