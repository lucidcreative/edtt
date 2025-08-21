import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  Trophy, 
  Star, 
  X,
  Sparkles,
  Target
} from "lucide-react";

interface TokenNotificationProps {
  notification: {
    id: string;
    type: 'tokens_awarded' | 'milestone_reached' | 'achievement_unlocked';
    title: string;
    message: string;
    amount?: number;
    milestoneValue?: number;
    icon?: string;
  };
  onDismiss: (id: string) => void;
  autoDisappear?: boolean;
  duration?: number;
}

export default function TokenNotification({ 
  notification, 
  onDismiss, 
  autoDisappear = true, 
  duration = 5000 
}: TokenNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDisappear) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoDisappear, duration, notification.id, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'tokens_awarded':
        return <Gift className="w-6 h-6 text-white" />;
      case 'milestone_reached':
        return <Target className="w-6 h-6 text-white" />;
      case 'achievement_unlocked':
        return <Trophy className="w-6 h-6 text-white" />;
      default:
        return <Star className="w-6 h-6 text-white" />;
    }
  };

  const getGradient = () => {
    switch (notification.type) {
      case 'tokens_awarded':
        return 'from-green-500 to-emerald-600';
      case 'milestone_reached':
        return 'from-purple-500 to-violet-600';
      case 'achievement_unlocked':
        return 'from-yellow-500 to-orange-600';
      default:
        return 'from-blue-500 to-indigo-600';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4"
        >
          <Card className={`relative overflow-hidden bg-gradient-to-r ${getGradient()} text-white shadow-2xl border-0`}>
            {/* Sparkle Animation Background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ 
                    x: Math.random() * 400, 
                    y: Math.random() * 200,
                    opacity: 0,
                    scale: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white/30" />
                </motion.div>
              ))}
            </div>

            <div className="relative p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  {getIcon()}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-bold text-lg mb-1"
                  >
                    {notification.title}
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-sm mb-2"
                  >
                    {notification.message}
                  </motion.p>

                  {/* Amount Display */}
                  {notification.amount && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm font-bold backdrop-blur-sm"
                    >
                      <span>+{notification.amount}</span>
                      <span>🪙</span>
                    </motion.div>
                  )}

                  {/* Milestone Value */}
                  {notification.milestoneValue && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm font-bold backdrop-blur-sm"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>{notification.milestoneValue} Tokens</span>
                    </motion.div>
                  )}
                </div>

                {/* Dismiss Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  data-testid="button-dismiss-notification"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress Bar for Auto-dismiss */}
              {autoDisappear && (
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-white/30"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: duration / 1000, ease: "linear" }}
                />
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Notification Queue Manager Component
interface NotificationQueueProps {
  notifications: Array<{
    id: string;
    type: 'tokens_awarded' | 'milestone_reached' | 'achievement_unlocked';
    title: string;
    message: string;
    amount?: number;
    milestoneValue?: number;
    icon?: string;
  }>;
  onDismiss: (id: string) => void;
}

export function NotificationQueue({ notifications, onDismiss }: NotificationQueueProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: 1, 
              y: index * 120,
              transition: { delay: index * 0.1 }
            }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto"
            style={{ zIndex: 1000 - index }}
          >
            <TokenNotification
              notification={notification}
              onDismiss={onDismiss}
              autoDisappear={true}
              duration={5000 + (index * 1000)} // Stagger dismissal
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}