import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { removeAuthToken } from "@/lib/authUtils";
import { motion } from "framer-motion";

const navigation = [
  { path: '/', name: 'Dashboard', icon: 'fas fa-home' },
  { path: '/students', name: 'Students', icon: 'fas fa-users' },
  { path: '/assignments', name: 'Assignments', icon: 'fas fa-tasks' },
  { path: '/store', name: 'Store', icon: 'fas fa-store' },
  { path: '/analytics', name: 'Analytics', icon: 'fas fa-chart-bar' },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    removeAuthToken();
    window.location.reload();
  };

  return (
    <aside className="w-16 lg:w-64 bg-white shadow-lg transition-all duration-300 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            BC
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-gray-800">BizCoin</h1>
            <p className="text-xs text-gray-500">Economy Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <button
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                location === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
            >
              <i className={`${item.icon} text-lg`}></i>
              <span className="hidden lg:inline font-medium">{item.name}</span>
            </button>
          </motion.div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.nickname || user?.email}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
            data-testid="img-profile-avatar"
          />
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate" data-testid="text-user-name">
              {user?.role === 'teacher' 
                ? `${user?.firstName} ${user?.lastName}`.trim() || user?.email
                : user?.nickname
              }
            </p>
            <p className="text-xs text-gray-500 capitalize" data-testid="text-user-role">
              {user?.role}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full hidden lg:flex"
          data-testid="button-logout"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </Button>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full lg:hidden"
          data-testid="button-logout-mobile"
        >
          <i className="fas fa-sign-out-alt"></i>
        </Button>
      </div>
    </aside>
  );
}
