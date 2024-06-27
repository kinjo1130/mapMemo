import { db } from './init/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const isWithinUserPeriod = async (userId: string, timestamp: Date): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('No period set for user');
      return true; // 期間情報がない場合は全期間保存
    }

    const userData = userDoc.data();
    if (!userData || !userData.period) {
      console.log('No period set for user');
      return true; // 期間情報がない場合は全期間保存
    }

    const { startDate, endDate } = userData.period;

    // 期間情報がnullの場合は全期間保存
    if (!startDate || !endDate) {
      console.log('Incomplete period data, allowing all timestamps');
      return true;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return timestamp >= start && timestamp <= end;
  } catch (error) {
    console.error('Error checking user period:', error);
    return true; // エラーが発生した場合も全期間保存
  }
};
