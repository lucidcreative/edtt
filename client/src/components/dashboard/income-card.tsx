import { motion } from "framer-motion";

interface IncomeCardProps {
  tokens: number;
}

export default function IncomeCard({ tokens }: IncomeCardProps) {
  const todayIncome = Math.floor(tokens * 0.1) || 10; // Mock calculation

  return (
    <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Today's Income</h3>
      <div className="text-4xl font-bold text-gray-800 mb-2" data-testid="today-income-value">
        {todayIncome} tokens
      </div>
      <p className="text-gray-700 text-sm mb-4">Great job on your assignments!</p>
      
      <div className="absolute bottom-4 right-4">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=celebration&backgroundColor=ffd5dc&mood=happy`}
            alt="Student celebrating success"
            className="w-16 h-16 rounded-full"
            data-testid="celebration-avatar"
          />
        </motion.div>
      </div>
    </div>
  );
}
