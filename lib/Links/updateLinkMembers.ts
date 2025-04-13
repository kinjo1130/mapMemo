import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../init/firebase";

/**
 * グループに関連する既存のリンクのmembersフィールドを更新する
 * @param groupId グループID
 * @param userId 追加するユーザーID
 * @returns 更新されたリンクの数
 */
export const updateLinkMembers = async (groupId: string, userId: string): Promise<number> => {
  try {
    const linksRef = collection(db, 'Links');
    const q = query(linksRef, where('groupId', '==', groupId));
    const querySnapshot = await getDocs(q);
    
    // リンクが存在しない場合は0を返す
    if (querySnapshot.empty) {
      console.log('No links found for this group');
      return 0;
    }
    
    // バッチサイズの制限（Firestoreの制限は500）
    const BATCH_SIZE = 450;
    let batchCount = 0;
    let totalUpdated = 0;
    let batch = writeBatch(db);
    
    // 各リンクのmembersフィールドにユーザーIDを追加
    querySnapshot.docs.forEach((doc, index) => {
      const linkData = doc.data();
      // すでにメンバーに含まれている場合はスキップ
      if (linkData.members && linkData.members.includes(userId)) {
        return;
      }
      
      // membersフィールドが配列でない場合は新しい配列を作成
      const members = Array.isArray(linkData.members) ? [...linkData.members, userId] : [userId];
      batch.update(doc.ref, { members });
      batchCount++;
      totalUpdated++;
      
      // バッチサイズに達したらコミットして新しいバッチを作成
      if (batchCount >= BATCH_SIZE || index === querySnapshot.docs.length - 1) {
        batch.commit().then(() => {
          console.log(`Batch committed: ${batchCount} links updated`);
        }).catch(error => {
          console.error('Error committing batch:', error);
        });
        
        // 最後のドキュメント以外の場合は新しいバッチを作成
        if (index < querySnapshot.docs.length - 1) {
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    });
    
    console.log(`Total links updated: ${totalUpdated}`);
    return totalUpdated;
  } catch (error) {
    console.error('Error updating links with new member:', error);
    throw error;
  }
};
