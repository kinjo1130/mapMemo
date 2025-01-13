
import { Button } from "@/components/LP/button";
import liff from "@line/liff";
export function CTASection() {
  const handleButtonClick = () => {
    if (liff.getOS() === "web") {
      liff.login();
    } else {
      window.location.href = process.env.NEXT_PUBLIC_LINE_BOT_ADD_FRIEND_URL!;
    }
  };
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
        <Button size="lg" className="bg-[#2D7B51] hover:bg-[#329C5A]" onClick={handleButtonClick}>
          友だち追加する
        </Button>
      </div>
    </section>
  );
}