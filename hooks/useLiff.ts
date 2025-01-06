import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { initLiff } from '../lib/init/liff';
import {  useRouter } from 'next/router';

export const useLiff = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const profile = await initLiff();
        if (profile) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("LIFF initialization failed", error);
      }
    };

    initializeLiff();
  }, []);

  const logout = async () => {
    console.log('Logging out');
    if (liff.isLoggedIn()) {
      liff.logout();
      setIsAuthenticated(false); // ログアウト後に認証状態をリセット
      router.push('/');
    }
  }

  return { isAuthenticated, logout };
}