import { useEffect, useState } from 'react';
import liff from '@line/liff';

export const useLiff = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID ?? '' });
        if (liff.isLoggedIn()) {
          setIsAuthenticated(true);
        } else {
          liff.login();
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
      window.location.reload();
    }
  }

  return { isAuthenticated, logout };
}