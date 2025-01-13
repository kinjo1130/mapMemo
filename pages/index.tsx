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
    // ユーザーが認証済みで、かつLPページにいる場合のみホームページにリダイレクト
    if (isAuthenticated && router.pathname === '/') {
      router.push("/home");
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