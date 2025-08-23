import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { removeAuthToken } from "@/lib/authUtils";
import { motion } from "framer-motion";

const teacherNavigation = [
  { path: '/', name: 'Dashboard', icon: 'fas fa-home' },
  { path: '/students', name: 'Students', icon: 'fas fa-users' },
  { path: '/announcements', name: 'Announcements', icon: 'fas fa-bullhorn' },
  { path: '/assignments', name: 'Assignments', icon: 'fas fa-tasks' },
  { path: '/time-tracking', name: 'Time Clock', icon: 'fas fa-clock' },
  { path: '/store', name: 'Store', icon: 'fas fa-store' },
  { path: '/analytics', name: 'Analytics', icon: 'fas fa-chart-bar' },
  { path: '/badges', name: 'Badges', icon: 'fas fa-award' },
  { path: '/challenges', name: 'Challenges', icon: 'fas fa-trophy' },
];

const studentNavigation = [
  { path: '/', name: 'Dashboard', icon: 'fas fa-home' },
  { path: '/assignments', name: 'My Assignments', icon: 'fas fa-tasks' },
  { path: '/store', name: 'Token Store', icon: 'fas fa-store' },
  { path: '/announcements', name: 'Announcements', icon: 'fas fa-bullhorn' },
  { path: '/time-tracking', name: 'Time Clock', icon: 'fas fa-clock' },
  { path: '/progress', name: 'My Progress', icon: 'fas fa-chart-line' },
  { path: '/badges', name: 'My Badges', icon: 'fas fa-award' },
  { path: '/challenges', name: 'Challenges', icon: 'fas fa-trophy' },
];

export default function MobileMenu() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    window.location.reload();
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <i className="fas fa-bars text-lg"></i>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                BC
              </div>
              <div>
                <SheetTitle className="text-left">BizCoin</SheetTitle>
                <p className="text-xs text-gray-500">Economy Platform</p>
              </div>
            </div>
          </SheetHeader>

          {/* User Profile */}
          <div className="flex items-center space-x-3 py-4 border-b border-gray-200">
            <img
              src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.nickname || user?.email}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.role === 'teacher' 
                  ? `${user?.firstName} ${user?.lastName}`.trim() || user?.email
                  : user?.nickname
                }
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="py-4 space-y-1">
            {(user?.role === 'student' ? studentNavigation : teacherNavigation).map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                    location === item.path
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  data-testid={`mobile-menu-${item.path.slice(1) || 'dashboard'}`}
                >
                  <i className={`${item.icon} text-lg`}></i>
                  <span className="font-medium">{item.name}</span>
                </button>
              </motion.div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
              data-testid="button-logout-mobile-menu"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}