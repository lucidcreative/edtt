import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import MobileMenu from "@/components/mobile-menu";

const pageInfo = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Welcome back, track your classroom progress'
  },
  '/students': {
    title: 'Student Management',
    subtitle: 'Manage your classroom roster and student progress'
  },
  '/assignments': {
    title: 'Assignments',
    subtitle: 'Create and manage classroom assignments'
  },
  '/store': {
    title: 'Store Management',
    subtitle: 'Manage classroom rewards and items'
  },
  '/analytics': {
    title: 'Analytics Dashboard',
    subtitle: 'Track student progress and engagement metrics'
  }
};

export default function Header() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const currentPage = pageInfo[location as keyof typeof pageInfo] || pageInfo['/'];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <MobileMenu />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 lg:flex-none text-center lg:text-left"
        >
          <h1 className="text-xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100" data-testid="text-page-title">
            {currentPage.title}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1 hidden lg:block" data-testid="text-page-subtitle">
            {currentPage.subtitle}
          </p>
        </motion.div>
        
        <motion.div 
          className="flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {user?.role === 'student' && (
            <>
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <i className="fas fa-coins text-blue-600"></i>
                <span className="font-medium text-blue-800" data-testid="text-user-tokens">
                  {user.tokens || 0}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                <i className="fas fa-trophy text-purple-600"></i>
                <span className="font-medium text-purple-800" data-testid="text-user-level">
                  Level {user.level || 1}
                </span>
              </div>
            </>
          )}
          
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle theme"
            data-testid="button-theme-toggle"
          >
            {theme === 'light' ? (
              <i className="fas fa-moon text-xl"></i>
            ) : (
              <i className="fas fa-sun text-xl"></i>
            )}
          </button>
        </motion.div>
      </div>
    </header>
  );
}
