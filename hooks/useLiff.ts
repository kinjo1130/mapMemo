// hooks/useLiff.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import liff from '@line/liff';
import { saveUserProfile } from '../lib/User/saveUserProfile';

export const useLiff = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        setIsInitialized(true);
        
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          await saveUserProfile(profile);
          setIsAuthenticated(true);
        } else if (router.pathname === '/home') {
          // 未認証状態でホームページにアクセスした場合はトップページへリダイレクト
          router.replace('/');
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error);
      }
    };

    initialize();
  }, [router.pathname]);

  const login = async () => {
    try {
      if (!isInitialized) {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
      }
      const isDev = process.env.NODE_ENV === 'development';
     const baseUrl = isDev ? process.env.NEXT_PUBLIC_LIFF_URL_DEV : process.env.NEXT_PUBLIC_LIFF_URL_PROD;
     liff.login({
        redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/home`
      });
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };

  const logout = async () => {
    try {
      await liff.logout();
      setIsAuthenticated(false);
      router.replace('/'); // ログアウト後にトップページへリダイレクト
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return {
    isAuthenticated,
    isInitialized,
    login,
    logout
  };
};