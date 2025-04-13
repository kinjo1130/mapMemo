import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../init/firebase";
import { updateLinkMembers } from "../Links/updateLinkMembers";

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

    // すでにグループに入っている場合は何もしない
    if (groupData.members.includes(userId)) {
      console.log('User already in group');
      return false;
    }

    // グループのメンバーリストを更新
    const updatedMembers = [...groupData.members, userId];
    await updateDoc(groupRef, { members: updatedMembers });
    
    // グループに関連する既存のリンクのmembersフィールドを更新
    try {
      const updatedCount = await updateLinkMembers(groupId, userId);
      console.log(`Updated ${updatedCount} links with new member: ${userId}`);
    } catch (error) {
      console.error('Error updating links with new member:', error);
      // リンクの更新に失敗してもグループへの参加自体は成功とする
    }
    
    return true;
  } catch (error) {
    console.error('Error joining group:', error);
    return false;
  }
}
