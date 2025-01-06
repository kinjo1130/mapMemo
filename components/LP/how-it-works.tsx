import { StepCard } from "@/components/LP/step-card";

const steps = [
  {
    number: "1",
    title: "友だち追加",
    description: "MapMemoのLINE公式アカウントを友だち追加",
  },
  {
    number: "2",
    title: "URLを送信",
    description: "保存したい場所のGoogle MapsのURLを送信",
  },
  {
    number: "3",
    title: "完了",
    description: "自動で保存完了。LIFFアプリから確認・管理",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-[#F5F9F7]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-16 text-[#294B49]">
          使い方
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <StepCard key={index} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}