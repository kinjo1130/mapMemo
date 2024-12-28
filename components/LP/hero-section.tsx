"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/LP/button";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#F5F9F7] to-white pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <MapPin className="h-12 w-12 text-[#329C5A]" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-[#294B49]">
            Map<span className="text-[#329C5A]">Memo</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            LINEで簡単に地図を保存・管理。あなたの大切な場所を、もっとスマートに記録しよう。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="bg-[#2D7B51] hover:bg-[#329C5A]" href={process.env.LIFF_URL_PROD}>
              今すぐ始める
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}