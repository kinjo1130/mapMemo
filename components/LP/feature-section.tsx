import { Map, Search, Tag, Clock, Share2, Users } from "lucide-react";
import { FeatureCard } from "@/components/LP/feature-card";

const features = [
  {
    icon: <Map className="h-6 w-6" />,
    title: "簡単保存",
    description: "LINEにURLを送るだけで地図情報を自動保存。手間なく場所を記録できます。",
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "スマート検索",
    description: "場所の名前や住所から、すばやく目的の場所を見つけ出せます。",
  },
  // {
  //   icon: <Tag className="h-6 w-6" />,
  //   title: "カスタムタグ",
  //   description: "自分だけのタグで場所を整理。効率的な管理を実現します。",
  // },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "保存期間設定",
    description: "グループごとに保存期間を設定可能。必要な情報を適切に管理。",
  },
  {
    icon: <Share2 className="h-6 w-6" />,
    title: "かんたん共有",
    description: "保存した場所を個別・まとめて共有できます。",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "グループ対応",
    description: "LINEグループでの共同利用に対応。みんなで場所を共有。",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-16 text-[#294B49]">
          主な機能
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}