import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
  
  const currentPage = pageInfo[location as keyof typeof pageInfo] || pageInfo['/'];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:p-6">
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
          <h1 className="text-xl lg:text-3xl font-bold text-gray-800" data-testid="text-page-title">
            {currentPage.title}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1 hidden lg:block" data-testid="text-page-subtitle">
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
          
          <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <i className="fas fa-bell text-xl"></i>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
        </motion.div>
      </div>
    </header>
  );
}
