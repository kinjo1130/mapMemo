import { Group } from "@/types/Group";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../init/firebase";

export const getGroupInfo = async (groupId: string): Promise<Group | null> => {
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

    const group: Group = {
      groupId: groupId,
      groupName: groupData.groupName,
      members: groupData.members,
      pictureUrl: groupData.pictureUrl,
      updatedAt: groupData.updatedAt,
    };
    return group;
  } catch (error) {
    console.error('Error getting group info:', error);
    return null;
  }
}
