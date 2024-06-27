import { db } from './init/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const isWithinUserPeriod = async (userId: string, timestamp: Date): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('No period set for user');
      return false;
    }

    const { period } = userDoc.data()!;
    const { startDate, endDate } = period;
    const start = new Date(startDate);
    const end = new Date(endDate);

    return timestamp >= start && timestamp <= end;
  } catch (error) {
    console.error('Error checking user period:', error);
    return false;
  }
};
