// services/lineGroupService.ts
import { getOrFetchGroupInfo } from '@/lib/groupUtils';
import { IsJoinGroup } from '@/lib/Group/IsJoinGroup';
import { joinGroup } from '@/lib/Group/joinGroup';
import { lineUserService } from './lineUserService';

class LineGroupService {
  /**
   * グループメッセージを処理する
   */
  async processGroupMessage(groupId: string, userId: string): Promise<void> {
    try {
      const groupInfo = await getOrFetchGroupInfo(groupId, userId);
      console.log(`Group info: ${JSON.stringify(groupInfo)}`);
    } catch (error) {
      console.error('Error getting or fetching group info:', error);
      throw error;
    }
  }
  
  /**
   * 新しいメンバーの参加処理
   */
  async handleNewMember(groupId: string, userId: string): Promise<void> {
    try {
      // すでに参加している場合は何もしない
      if (await IsJoinGroup(groupId, userId)) {
        console.log(`User ${userId} already in group ${groupId}`);
        return;
      }
      
      // DBにユーザー情報がない場合は取得して保存
      if (!await lineUserService.checkUserExists(userId)) {
        await lineUserService.registerNewUser(userId);
      }
      
      // グループメンバーに追加
      await joinGroup(groupId, userId);
      console.log(`User ${userId} added to group ${groupId}`);
    } catch (error) {
      console.error('Error handling new group member:', error);
      throw error;
    }
  }
}

export const lineGroupService = new LineGroupService();