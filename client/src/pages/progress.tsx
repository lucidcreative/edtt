import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function StudentProgress() {
  const { user } = useAuth();

  // Get student's progress data
  const { data: progress, isLoading } = useQuery<any>({
    queryKey: ["/api/students", user?.id, "progress"],
    enabled: !!user?.id && user?.role === 'student'
  });

  // Get student's assignments
  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: ["/api/students", user?.id, "assignments"],
    enabled: !!user?.id && user?.role === 'student'
  });

  // Get student's badges
  const { data: badges = [] } = useQuery<any[]>({
    queryKey: ["/api/students", user?.id, "badges"],
    enabled: !!user?.id && user?.role === 'student'
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
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

  const completedAssignments = assignments.filter(a => a.status === 'graded').length;
  const totalAssignments = assignments.length;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800">My Progress</h1>
        <p className="text-gray-600 mt-1">Track your learning journey and achievements</p>
      </motion.div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <i className="fas fa-coins text-yellow-500"></i>
                Total Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{user?.tokens || 0}</div>
              <p className="text-sm text-gray-600 mt-1">Keep earning more!</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <i className="fas fa-level-up-alt text-blue-500"></i>
                Current Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{user?.level || 1}</div>
              <p className="text-sm text-gray-600 mt-1">Great progress!</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <i className="fas fa-award text-purple-500"></i>
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{badges.length}</div>
              <p className="text-sm text-gray-600 mt-1">Achievements unlocked</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Assignment Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-chart-line text-green-500"></i>
              Assignment Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm text-gray-600">{completedAssignments}/{totalAssignments}</span>
              </div>
              <Progress value={completionRate} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{completionRate}% Complete</span>
                <span>{totalAssignments - completedAssignments} Remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Achievements */}
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-trophy text-yellow-500"></i>
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.slice(0, 6).map((badge: any, index: number) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`w-10 h-10 bg-${badge.color}-100 rounded-full flex items-center justify-center`}>
                      <i className={`${badge.icon} text-${badge.color}-600`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{badge.name}</p>
                      <p className="text-xs text-gray-600">{badge.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Goals and Motivation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-target text-red-500"></i>
              Keep Going!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-medium text-blue-800 mb-2">Next Milestone</h4>
                <p className="text-sm text-blue-700">Complete 3 more assignments to reach Level {(user?.level || 1) + 1}!</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h4 className="font-medium text-green-800 mb-2">Token Goal</h4>
                <p className="text-sm text-green-700">Earn 50 more tokens to unlock new store items!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}