// src/lib/groupUtils.ts

import { getFirestore, doc, getDoc, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { GroupSummaryResponse } from '@line/bot-sdk';
import { client } from './init/line';
import { db } from './init/firebase'; // Firebaseアプリのインスタンスをインポート


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

export async function getOrFetchGroupInfo(groupId: string, userId: string): Promise<GroupInfo> {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    const docSnap = await getDoc(groupRef);

    if (!docSnap.exists()) {
      const groupInfo = await fetchGroupInfo(groupId);
      await saveGroupInfo(groupId, groupInfo, userId);
      return {
        groupId: groupInfo.groupId,
        groupName: groupInfo.groupName,
        pictureUrl: groupInfo.pictureUrl,
        updatedAt: new Date(),
        members: [userId]
      };
    } else {
      const data = docSnap.data() as GroupInfo;
      // メンバーが存在しない場合は追加
      if (!data.members.includes(userId)) {
        await saveGroupMembership(userId, groupId);
        data.members.push(userId);
      }
      return data;
    }
  } catch (error) {
    console.error('Error getting or fetching group info:', error);
    throw error;
  }
}