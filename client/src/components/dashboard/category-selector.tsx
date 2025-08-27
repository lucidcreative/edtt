import { useState } from "react";
import { motion } from "framer-motion";

const categories = [
  { id: 'math', name: 'Math', icon: 'fas fa-calculator', color: 'red' },
  { id: 'science', name: 'Science', icon: 'fas fa-flask', color: 'blue' },
  { id: 'history', name: 'History', icon: 'fas fa-landmark', color: 'green' },
];

export default function CategorySelector() {
  const [selectedCategory, setSelectedCategory] = useState('math');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Select Category</h3>
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-3 rounded-xl transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-blue-50 dark:bg-blue-900 ring-2 ring-blue-200 dark:ring-blue-700'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            data-testid={`category-${category.id}`}
          >
            <div className={`w-12 h-12 bg-${category.color}-100 dark:bg-${category.color}-800 rounded-full flex items-center justify-center mb-2 mx-auto`}>
              <i className={`${category.icon} text-${category.color}-600 dark:text-${category.color}-300 text-xl`}></i>
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-white text-center">{category.name}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
