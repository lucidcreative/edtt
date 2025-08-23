import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface StudentBadge {
  id: string;
  badgeId: string;
  studentId: string;
  awardedAt: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    criteria: any;
  };
}

export default function StudentBadges() {
  const { user } = useAuth();

  // Get student's earned badges
  const { data: badges = [], isLoading } = useQuery<StudentBadge[]>({
    queryKey: ["/api/students", user?.id, "badges"],
    enabled: !!user?.id && user?.role === 'student'
  });

  // Get student's progress toward badges
  const { data: progress } = useQuery({
    queryKey: ["/api/students", user?.id, "badge-progress"],
    enabled: !!user?.id && user?.role === 'student'
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800">My Badges</h1>
        <p className="text-gray-600 mt-1">Track your achievements and celebrate your progress!</p>
      </motion.div>

      {/* Achievement Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{badges.length}</div>
              <div className="text-lg opacity-90">Badges Earned</div>
              <div className="mt-4 text-sm opacity-80">
                Keep up the great work and unlock more achievements!
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Earned Badges */}
      {badges.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((studentBadge, index) => (
                <motion.div
                  key={studentBadge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 border-2 border-yellow-200">
                    <CardHeader className="pb-3">
                      <div className="text-center">
                        <div 
                          className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl mb-3 ${studentBadge.badge.color || 'bg-yellow-500'}`}
                        >
                          <i className={studentBadge.badge.icon || 'fas fa-star'}></i>
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {studentBadge.badge.name}
                        </CardTitle>
                        <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                          <i className="fas fa-trophy mr-1"></i>
                          Earned
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="text-center space-y-3">
                        <p className="text-sm text-gray-600">
                          {studentBadge.badge.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          Earned on {new Date(studentBadge.awardedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-trophy text-3xl text-white"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Badges Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Complete assignments, participate actively, and show great behavior to earn your first badge!
          </p>
        </motion.div>
      )}

      {/* Progress Toward Next Badges */}
      {progress && Object.keys(progress).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-chart-line text-blue-500"></i>
                Progress Toward Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(progress).slice(0, 3).map(([badgeId, progressData]: [string, any], index) => (
                  <div key={badgeId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${progressData.color || 'bg-blue-500'}`}>
                          <i className={progressData.icon || 'fas fa-star'}></i>
                        </div>
                        <span className="font-medium text-gray-800">{progressData.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {progressData.current}/{progressData.required}
                      </span>
                    </div>
                    <Progress 
                      value={(progressData.current / progressData.required) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500">{progressData.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}