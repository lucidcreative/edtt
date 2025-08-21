import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Home, 
  Users, 
  ShoppingBag, 
  BookOpen, 
  TrendingUp,
  Megaphone,
  Wallet,
  Award
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: string | number;
  roles?: ('teacher' | 'student')[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: Home,
    path: '/',
    roles: ['teacher', 'student']
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    path: '/wallet',
    roles: ['student']
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    path: '/students',
    roles: ['teacher']
  },
  {
    id: 'assignments',
    label: 'Tasks',
    icon: BookOpen,
    path: '/assignments',
    roles: ['teacher', 'student']
  },
  {
    id: 'store',
    label: 'Store',
    icon: ShoppingBag,
    path: '/store',
    roles: ['teacher', 'student']
  },
  {
    id: 'tokens',
    label: 'Awards',
    icon: Award,
    path: '/tokens',
    roles: ['teacher']
  },
  {
    id: 'announcements',
    label: 'News',
    icon: Megaphone,
    path: '/announcements',
    roles: ['teacher', 'student']
  },
  {
    id: 'analytics',
    label: 'Stats',
    icon: TrendingUp,
    path: '/analytics',
    roles: ['teacher']
  }
];

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;

  // Filter nav items based on user role
  const visibleItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user.role as 'teacher' | 'student')
  );

  // Limit to 5 items for optimal mobile experience
  const mobileItems = visibleItems.slice(0, 5);

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.id}
              href={item.path}
              className="relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors duration-200"
            >
              <motion.div
                className={`relative flex flex-col items-center justify-center ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", damping: 15, stiffness: 400 }}
              >
                {/* Active background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeBackground"
                    className="absolute -inset-2 bg-blue-100 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                  />
                )}
                
                {/* Icon container */}
                <div className="relative mb-1">
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  />
                  
                  {/* Badge for notifications */}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0 min-w-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                
                {/* Label */}
                <span 
                  className={`text-xs font-medium truncate max-w-full transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
      
      {/* iPhone home indicator spacing */}
      <div className="h-1" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </motion.nav>
  );
}

// Extended navigation menu for accessing all features
export function MobileNavDrawer() {
  const { user } = useAuth();
  
  if (!user) return null;

  const allItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user.role as 'teacher' | 'student')
  );

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {allItems.map((item) => {
        const Icon = item.icon;
        
        return (
          <Link
            key={item.id}
            href={item.path}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {item.label}
              </div>
              {item.badge && (
                <div className="text-xs text-gray-500">
                  {item.badge} new
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}