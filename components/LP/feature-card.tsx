interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group p-6 rounded-lg border border-gray-200 hover:border-[#329C5A] transition-colors">
      <div className="text-[#2D7B51] group-hover:text-[#329C5A] transition-colors mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-[#294B49]">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}