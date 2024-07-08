import { Profile } from '@line/bot-sdk';
import { db } from '../init/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Firestoreの初期化（Firebase Admin SDKを使う場合）

export const getCurrentUser = async (userId: string): Promise<Profile | null> => {
  try {
    // Firestoreのユーザードキュメントを取得
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists) {
      console.log('ユーザーが見つかりませんでした');
      return null;
    }

    // FirestoreのデータをProfile型に変換
    const userData = userDoc.data();
    if (userData) {
      const profile: Profile = {
        userId: userData.userId,
        displayName: userData.displayName,
        pictureUrl: userData.pictureUrl,
        statusMessage: userData.statusMessage,
      };

      return profile;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Firestoreからユーザー情報を取得する際にエラーが発生しました:', error);
    return null;
  }
};
