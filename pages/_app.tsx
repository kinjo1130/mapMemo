// _app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLiff } from '@/hooks/useLiff';
import { useProfile } from '@/hooks/useProfile';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { isAuthenticated } = useLiff();

  useEffect(() => {
    // 認証前やrouter準備前は何もしない
    if (!isAuthenticated || !router.isReady) return;

    // ルートパスを解析
    const path = router.asPath;
    const isShareUrl = path.includes('/collections/share/');
    const isInviteUrl = path.includes('/collections/invite/');

    // シェアまたは招待URLの場合の処理
    if (isShareUrl || isInviteUrl) {
      const collectionId = path.split('/').pop();
      if (collectionId) {
        router.replace({
          pathname: '/home',
          query: {
            tab: 'collections',
            collectionId: collectionId
          }
        });
        return;
      }
    }

    // その他のページの処理
    const isHomePage = router.pathname === '/home';
    const isCollectionPage = router.pathname.startsWith('/collections/');
    
    if (!isHomePage && !isCollectionPage) {
      router.replace('/home');
    }
  }, [isAuthenticated, router.isReady, router.asPath]);

  return <Component {...pageProps} />;
}

export default MyApp;