// src/lib/groupUtils.ts

import { getFirestore, doc, getDoc, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { GroupSummaryResponse } from '@line/bot-sdk';
import { client } from './init/line';
import { db } from './init/firebase'; // Firebaseアプリのインスタンスをインポート
import { getGroupInfo } from './Group/getGroupInfo';


export interface GroupInfo {
  groupId: string;
  groupName: string;
  pictureUrl?: string;
  updatedAt: Date;
  members: string[]; // メンバーのユーザーIDの配列
}

export async function saveGroupMembership(userId: string, groupId: string) {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    await setDoc(groupRef, {
      members: arrayUnion(userId),
      updatedAt: Timestamp.now()
    }, { merge: true });
    console.log(`Group membership saved for user ${userId} in group ${groupId}`);
  } catch (error) {
    console.error('Error saving group membership:', error);
    throw error;
  }
}

export async function checkGroupExists(groupId: string): Promise<boolean> {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    const docSnap = await getDoc(groupRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking group existence:', error);
    throw error;
  }
}

export async function fetchGroupInfo(groupId: string): Promise<GroupSummaryResponse> {
  try {
    const groupInfo = await client.getGroupSummary(groupId);
    return groupInfo;
  } catch (error) {
    console.error('Error fetching group info from LINE API:', error);
    throw error;
  }
}

export async function saveGroupInfo(groupId: string, groupInfo: GroupSummaryResponse, userId: string) {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    const groupInfoToSave: GroupInfo = {
      groupId: groupInfo.groupId,
      groupName: groupInfo.groupName,
      pictureUrl: groupInfo.pictureUrl,
      updatedAt: new Date(),
      members: [userId] // 初期メンバーとして追加
    };
    await setDoc(groupRef, groupInfoToSave, { merge: true });
    console.log(`Group info saved for group ${groupId}`);
  } catch (error) {
    console.error('Error saving group info:', error);
    throw error;
  }
}

/**
 * グループが存在しない場合に、LINE APIからグループ情報を取得して保存する
 * @param groupId グループID
 * @param userId ユーザーID
 * @returns 新しく作成されたグループ情報
 */
async function createGroupFromLineApi(groupId: string, userId: string): Promise<GroupInfo> {
  // LINE APIからグループ情報を取得
  const lineGroupInfo = await fetchGroupInfo(groupId);
  
  // 既存のグループ情報があるか確認（念のため）
  const existingGroupInfo = await getGroupInfo(groupId);
  
  // メンバーリストを作成（既存のグループ情報がある場合はそのメンバーも含める）
  const members = existingGroupInfo 
    ? [userId, ...existingGroupInfo.members.filter(id => id !== userId)]
    : [userId];
  
  // グループ情報をFirestoreに保存
  await saveGroupInfo(groupId, lineGroupInfo, userId);
  
  // 新しいグループ情報を返す
  return {
    groupId: lineGroupInfo.groupId,
    groupName: lineGroupInfo.groupName,
    pictureUrl: lineGroupInfo.pictureUrl,
    updatedAt: new Date(),
    members
  };
}

/**
 * グループ情報を取得または作成する
 * 1. Firestoreからグループ情報を取得
 * 2. グループが存在しない場合はLINE APIから情報を取得して作成
 * 3. ユーザーがメンバーに含まれていない場合は追加
 * 
 * @param groupId グループID
 * @param userId ユーザーID
 * @returns グループ情報
 */
export async function getOrFetchGroupInfo(groupId: string, userId: string): Promise<GroupInfo> {
  try {
    // Firestoreからグループ情報を取得
    const groupRef = doc(db, 'Groups', groupId);
    const docSnap = await getDoc(groupRef);

    // グループが存在しない場合は新規作成
    if (!docSnap.exists()) {
      return await createGroupFromLineApi(groupId, userId);
    }
    
    // グループが存在する場合
    const data = docSnap.data() as GroupInfo;
    
    // ユーザーがメンバーに含まれていない場合は追加
    if (!data.members.includes(userId)) {
      await saveGroupMembership(userId, groupId);
      data.members.push(userId);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting or fetching group info:', error);
    throw error;
  }
}
