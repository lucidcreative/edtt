import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  gradient: string;
  progress?: number;
  onClick?: () => void;
}

export default function MetricCard({ title, value, subtitle, icon, gradient, progress, onClick }: MetricCardProps) {
  return (
    <div 
      className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white hover:shadow-lg transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      }`}
      onClick={onClick}
      data-testid={`metric-card-${title.toLowerCase().replace(' ', '-')}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <i className={`${icon} text-2xl opacity-80`}></i>
      </div>
      
      <div className="text-4xl font-bold mb-2" data-testid={`metric-${title.toLowerCase()}-value`}>
        {value}
      </div>
      
      <div className="text-white/80 text-sm mb-4" data-testid={`metric-${title.toLowerCase()}-subtitle`}>
        {subtitle}
      </div>
      
      {progress !== undefined && (
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            className="bg-white h-2 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      )}
    </div>
  );
}
