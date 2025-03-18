import { client } from '@/lib/init/line';
import { saveUserProfile } from '@/lib/User/saveUserProfile';
import { checkUserExists } from '@/lib/User/checkUserExists';
import { isWithinUserPeriod } from '@/lib/User/checkUserPeriod';
import { Profile } from '@line/bot-sdk';

class LineUserService {
  /**
   * 新しいユーザーを登録する
   */
  async registerNewUser(userId: string): Promise<void> {
    try {
      const profile = await client.getProfile(userId) as Profile;
      await saveUserProfile(profile);
      console.log(`User profile saved for: ${userId}`);
    } catch (error) {
      console.error('Error getting profile or saving user:', error);
      throw error;
    }
  }
  
  /**
   * ユーザーが存在するかチェックする
   */
  async checkUserExists(userId: string): Promise<boolean> {
    return await checkUserExists(userId);
  }
  
  /**
   * ユーザーの指定期間内かどうかをチェックする
   */
  async isWithinUserPeriod(userId: string, timestamp: Date): Promise<boolean> {
    return await isWithinUserPeriod(userId, timestamp);
  }
}

export const lineUserService = new LineUserService();