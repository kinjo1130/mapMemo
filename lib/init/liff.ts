import liff from '@line/liff';
import { saveUserProfile } from '../User/saveUserProfile';
import { Profile } from '@line/bot-sdk';

const initLiff = async (): Promise<Profile> => {
  try {
    await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
    if (!liff.isLoggedIn()) {
      liff.login();
    }
    const profile = await liff.getProfile();

    // Firestoreにユーザー情報を保存
    await saveUserProfile(profile);

    return profile;
  } catch (error) {
    console.error('LIFF initialization failed or error saving user profile:', error);
    throw error;
  }
};

export { initLiff };
