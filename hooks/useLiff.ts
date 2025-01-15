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
          
          // redirectPathの処理を改善
          const redirectPath = sessionStorage.getItem('redirectPath');
          if (redirectPath) {
            // コレクションIDを抽出
            const collectionId = redirectPath.split('/').pop();
            if (redirectPath.includes('/collections/share/') || redirectPath.includes('/collections/invite/')) {
              // シェアまたは招待URLの場合、コレクション詳細画面に遷移
              sessionStorage.removeItem('redirectPath');
              router.replace({
                pathname: '/home',
                query: {
                  tab: 'collections',
                  collectionId
                }
              });
            } else {
              // その他のリダイレクトパスの場合
              sessionStorage.removeItem('redirectPath');
              router.replace(redirectPath);
            }
          } else if (router.pathname === '/') {
            router.replace('/home');
          }
        } else if (router.pathname === '/home') {
          router.replace('/');
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error);
      }
    };

    initialize();
  }, [router.pathname]);

  const login = async (redirectPath?: string) => {
    try {
      if (!isInitialized) {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
      }
      if (redirectPath) {
        sessionStorage.setItem('redirectPath', redirectPath);
        const isDev = process.env.NODE_ENV === 'development';
        const baseUrl = isDev ? process.env.NEXT_PUBLIC_LIFF_URL_DEV : process.env.NEXT_PUBLIC_LIFF_URL_PROD;
  
        // /collections/invite/:idからコレクションIDを抽出
        const collectionId = redirectPath.split('/').pop();
        // クエリパラメータを含むパスを構築
        const pathWithQuery = `home?tab=collections&collectionId=${collectionId}`;
        
        liff.login({ redirectUri: `${baseUrl}/${pathWithQuery}` });
        return;
      }
      liff.login();
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };

  const logout = async () => {
    try {
      await liff.logout();
      setIsAuthenticated(false);
      sessionStorage.removeItem('redirectPath');
      router.replace('/');
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