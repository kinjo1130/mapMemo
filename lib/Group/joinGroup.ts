import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../init/firebase";

export const joinGroup = async (groupId: string, userId: string): Promise<boolean> => {
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

    if (groupData.members.includes(userId)) {
      console.log('User already in group');
      return false;
    }

    const updatedMembers = [...groupData.members, userId];
    await updateDoc(groupRef, { members: updatedMembers });
    return true;
  } catch (error) {
    console.error('Error joining group:', error);
    return false;
  }
}