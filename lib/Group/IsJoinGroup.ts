import { doc, getDoc } from "firebase/firestore";
import { db } from "../init/firebase";

export const isJoinGroup = async (groupId: string, userId: string): Promise<boolean> => {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists) {
      console.log('Group does not exist');
      return false;
    }

    const groupData = groupDoc.data();
    if (!groupData || !groupData.members) {
      console.log('No members in group');
      return false;
    }

    return groupData.members.includes(userId);
  } catch (error) {
    console.error('Error checking group membership:', error);
    return false;
  }
}