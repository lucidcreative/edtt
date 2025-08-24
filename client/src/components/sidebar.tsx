import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { removeAuthToken } from "@/lib/authUtils";
import { motion } from "framer-motion";
import StudentProfileDialog from "@/components/student/student-profile-dialog";

const teacherNavigation = [
  { path: '/', name: 'Dashboard', icon: 'fas fa-home' },
  { path: '/students', name: 'Students', icon: 'fas fa-users' },
  { path: '/announcements', name: 'Announcements', icon: 'fas fa-bullhorn' },
  { path: '/earn', name: 'Earn', icon: 'fas fa-coins' },
  { path: '/store', name: 'Store', icon: 'fas fa-store' },
  { path: '/analytics', name: 'Analytics', icon: 'fas fa-chart-bar' },
  { path: '/leaderboard', name: 'Leaderboard', icon: 'fas fa-trophy' },
];

const studentNavigation = [
  { path: '/', name: 'Dashboard', icon: 'fas fa-home' },
  { path: '/earn', name: 'Earn', icon: 'fas fa-coins' },
  { path: '/store', name: 'Token Store', icon: 'fas fa-store' },
  { path: '/economy', name: 'Economy', icon: 'fas fa-exchange-alt' },
  { path: '/announcements', name: 'Announcements', icon: 'fas fa-bullhorn' },
  { path: '/leaderboard', name: 'Leaderboard', icon: 'fas fa-trophy' },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    window.location.reload();
  };

  return (
    <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            BC
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-gray-800 dark:text-gray-100">BizCoin</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Economy Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {(user?.role === 'student' ? studentNavigation : teacherNavigation).map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <button
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-sm ${
                location === item.path
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm scale-[1.01]'
                  : 'text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-gray-50 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
            >
              <i className={`${item.icon} text-lg`}></i>
              <span className="font-medium">{item.name}</span>
            </button>
          </motion.div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => user?.role === 'student' ? setIsProfileDialogOpen(true) : undefined}
          className={`w-full flex items-center space-x-3 mb-3 p-2 rounded-lg transition-all duration-200 ${
            user?.role === 'student' 
              ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group' 
              : 'cursor-default'
          }`}
          data-testid="button-profile"
        >
          <img
            src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.nickname || user?.email}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
            data-testid="img-profile-avatar"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate" data-testid="text-user-name">
              {user?.role === 'teacher' 
                ? `${user?.firstName} ${user?.lastName}`.trim() || user?.email
                : user?.nickname
              }
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-300 capitalize" data-testid="text-user-role">
              {user?.role}
            </p>
          </div>
          {user?.role === 'student' && (
            <i className="fas fa-edit text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 text-sm"></i>
          )}
        </button>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full"
          data-testid="button-logout"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </Button>
        
        {/* Student Profile Dialog */}
        {user?.role === 'student' && (
          <StudentProfileDialog 
            open={isProfileDialogOpen} 
            onOpenChange={setIsProfileDialogOpen} 
          />
        )}
      </div>
    </aside>
  );
}
