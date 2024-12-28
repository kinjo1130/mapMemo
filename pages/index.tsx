import { useEffect } from "react";
import { useRouter } from "next/router";
import { HeroSection } from "@/components/LP/hero-section";
import { FeaturesSection } from "@/components/LP/feature-section";
import { HowItWorks } from "@/components/LP/how-it-works";
import { CTASection } from "@/components/LP/cta-section";
import { useLiff } from "@/hooks/useLiff";
import liff from "@line/liff";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useLiff();

  useEffect(() => {
    if (isAuthenticated) {
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

  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
    </main>
  );
}