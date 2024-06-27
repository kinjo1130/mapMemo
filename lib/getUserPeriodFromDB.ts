import { db } from './init/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserPeriod } from './saveUserPeriod';

export const getUserPeriodFromDB = async (userId: string): Promise<UserPeriod | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    if (!userData || !userData.period) {
      return null;
    }

    const { startDate, endDate } = userData.period;

    // 期間データが存在するかチェック
    const period: UserPeriod = { userId };
    if (startDate) {
      period.startDate = startDate;
    }
    if (endDate) {
      period.endDate = endDate;
    }

    return period;
  } catch (error) {
    console.error('Error fetching user period from DB:', error);
    return null;
  }
};
