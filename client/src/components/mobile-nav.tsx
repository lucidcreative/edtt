import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const teacherMobileNav = [
  { path: '/', name: 'Home', icon: 'fas fa-home' },
  { path: '/students', name: 'Students', icon: 'fas fa-users' },
  { path: '/earn', name: 'Earn', icon: 'fas fa-coins' },
  { path: '/store', name: 'Store', icon: 'fas fa-store' },
  { path: '/leaderboard', name: 'Leaderboard', icon: 'fas fa-trophy' },
];

const studentMobileNav = [
  { path: '/', name: 'Home', icon: 'fas fa-home' },
  { path: '/earn', name: 'Earn', icon: 'fas fa-coins' },
  { path: '/store', name: 'Store', icon: 'fas fa-store' },
  { path: '/leaderboard', name: 'Leaderboard', icon: 'fas fa-trophy' },
];

export default function MobileNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const navigation = user?.role === 'student' ? studentMobileNav : teacherMobileNav;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden"
    >
      <div className="flex items-center justify-around py-2">
        {navigation.map((item, index) => (
          <motion.button
            key={item.path}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-gray-50 ${
              location === item.path
                ? 'text-blue-600 bg-blue-50 scale-105'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid={`mobile-nav-${item.path.slice(1) || 'dashboard'}`}
          >
            <i className={`${item.icon} text-lg mb-1`}></i>
            <span className="text-xs font-medium">{item.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}