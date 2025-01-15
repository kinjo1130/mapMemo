import { useEffect } from "react";
import { useRouter } from "next/router";
import { HeroSection } from "@/components/LP/hero-section";
import { FeaturesSection } from "@/components/LP/feature-section";
import { HowItWorks } from "@/components/LP/how-it-works";
import { CTASection } from "@/components/LP/cta-section";
import { useLiff } from "@/hooks/useLiff";
import { useProfile } from "@/hooks/useProfile";
import liff from "@line/liff";

export default function Home() {
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const { isAuthenticated } = useLiff();

  useEffect(() => {
    // セッションストレージからリダイレクト先を確認
    const redirectPath = sessionStorage.getItem('redirectPath');
    
    // 認証済みで、かつLPページにいる場合の処理
    if (isAuthenticated && router.pathname === '/') {
      if (redirectPath) {
        // リダイレクト先が保存されている場合は、そちらを優先
        const collectionId = redirectPath.split('/').pop();
        if (redirectPath.includes('/collections/share/') || redirectPath.includes('/collections/invite/')) {
          router.replace({
            pathname: '/home',
            query: {
              tab: 'collections',
              collectionId
            }
          });
        } else {
          router.replace(redirectPath);
        }
        sessionStorage.removeItem('redirectPath');
      } else {
        // リダイレクト先がない場合は通常通りホームへ
        router.replace("/home");
      }
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (liff) {
      if (liff.getOS() !== "web") {
        document.title = "MapMemo";
      }
    }
  }, [liff]);

  // ローディング中はローディング表示
  if (profileLoading) {
    return <div>Loading...</div>;
  }

  // 未認証の場合はLPを表示
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
      </main>
    );
  }

  // 認証済みの場合は何も表示せず（useEffectでリダイレクトされる）
  return null;
}