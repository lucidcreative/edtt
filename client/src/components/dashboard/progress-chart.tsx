import { motion } from "framer-motion";

const mockData = [40, 60, 45, 80, 35, 90, 70];
const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function ProgressChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Progress</h3>
        <span className="text-green-600 font-medium">↗ 78%</span>
      </div>
      
      <div className="flex items-end space-x-2 h-32 mb-2">
        {mockData.map((height, index) => (
          <div key={index} className="flex-1 flex items-end">
            <motion.div
              className="w-full bg-blue-500 rounded-t transition-all duration-1000"
              initial={{ height: "0%" }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              style={{ backgroundColor: '#3b82f6' }}
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  );
}
