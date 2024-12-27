import { Button } from "@/components/LP/button";

export function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-8 text-[#294B49]">
          さっそく始めよう
        </h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          MapMemoで、大切な場所の記録をもっと簡単に。
          今すぐLINEで友だち追加して始めましょう。
        </p>
        <Button size="lg" className="bg-[#2D7B51] hover:bg-[#329C5A]" href={process.env.LIFF_URL_PROD}>
          友だち追加する
        </Button>
      </div>
    </section>
  );
}