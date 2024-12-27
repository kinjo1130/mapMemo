interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="text-center group">
      <div className="w-12 h-12 rounded-full bg-[#2D7B51] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 group-hover:bg-[#329C5A] transition-colors">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-[#294B49]">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}