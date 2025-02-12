import { doc, getDoc } from 'firebase/firestore';
import { db } from '../init/firebase';
import { Group } from '@/types/Group';

// 参加している人のグループ情報
export const getJoinGroupInfo = async (groupId: string, userId: string): Promise<Group | null> => {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists) {
      console.log('Group does not exist');
      return null;
    }

    const groupData = groupDoc.data();
    if (!groupData || !groupData.members) {
      console.log('No members in group');
      return null;
    }

    if (groupData.members.includes(userId)) {
      const group: Group = {
        groupId: groupId,
        groupName: groupData.groupName,
        members: groupData.members,
        pictureUrl: groupData.pictureUrl,
      };
      return group;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error checking group membership:', error);
    return null;
  }
}
