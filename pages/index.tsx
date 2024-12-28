import { useEffect } from "react";
import { useRouter } from "next/router";
import { HeroSection } from "@/components/LP/hero-section";
import { FeaturesSection } from "@/components/LP/feature-section";
import { HowItWorks } from "@/components/LP/how-it-works";
import { CTASection } from "@/components/LP/cta-section";
import { useLiff } from "@/hooks/useLiff";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useLiff();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
    </main>
  );
}