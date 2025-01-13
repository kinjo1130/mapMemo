import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLiff } from '@/hooks/useLiff';
import { useProfile } from '@/hooks/useProfile';


// export default function App({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />;
// }
function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { isAuthenticated } = useLiff();
  const { profile } = useProfile();

  useEffect(() => {
    // パスが /collections/invite/ で始まる場合は処理をスキップ
    if (router.pathname.startsWith('/collections/invite/')) {
      return;
    }

    // それ以外の場合は通常のリダイレクト処理
    if (isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, router.pathname]);

  return <Component {...pageProps} />;
}

export default MyApp;