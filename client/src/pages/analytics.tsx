import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Analytics() {
  const { user } = useAuth();

  // Get user's classrooms
  const { data: classrooms } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  const currentClassroom = classrooms?.[0];

  // Get classroom stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "stats"],
    enabled: !!currentClassroom
  });

  // Get students for analytics
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "students"],
    enabled: !!currentClassroom
  });

  // Get leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "leaderboard"],
    enabled: !!currentClassroom
  });

  if (!currentClassroom) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <i className="fas fa-chart-bar text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Classroom Found</h3>
          <p className="text-gray-600">Create a classroom to view analytics.</p>
        </div>
      </div>
    );
  }

  if (statsLoading || studentsLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate analytics
  const totalTokensAwarded = students?.reduce((sum: number, student: any) => sum + (student.tokens || 0), 0) || 0;
  const averageTokens = students?.length ? Math.round(totalTokensAwarded / students.length) : 0;
  const completionRate = stats?.totalAssignments ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100) : 0;
  const engagementRate = 78; // Mock calculation
  
  // Mock weekly progress data
  const weeklyProgress = [
    { day: 'Mon', students: 12, assignments: 8, tokens: 240 },
    { day: 'Tue', students: 15, assignments: 12, tokens: 360 },
    { day: 'Wed', students: 10, assignments: 6, tokens: 180 },
    { day: 'Thu', students: 18, assignments: 15, tokens: 450 },
    { day: 'Fri', students: 14, assignments: 10, tokens: 300 },
    { day: 'Sat', students: 8, assignments: 4, tokens: 120 },
    { day: 'Sun', students: 6, assignments: 3, tokens: 90 },
  ];

  const topPerformers = leaderboard?.slice(0, 5) || [];

  return (
    <div className="p-4 lg:p-6 space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center">
                <i className="fas fa-users mr-2"></i>
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1" data-testid="metric-total-students">
                {stats?.totalStudents || 0}
              </div>
              <div className="text-blue-100 text-sm">Active learners</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center">
                <i className="fas fa-coins mr-2"></i>
                Total Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1" data-testid="metric-total-tokens">
                {totalTokensAwarded.toLocaleString()}
              </div>
              <div className="text-green-100 text-sm">Awarded to students</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center">
                <i className="fas fa-percentage mr-2"></i>
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1" data-testid="metric-completion-rate">
                {completionRate}%
              </div>
              <div className="text-purple-100 text-sm">Assignment completion</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center">
                <i className="fas fa-chart-line mr-2"></i>
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1" data-testid="metric-engagement-rate">
                {engagementRate}%
              </div>
              <div className="text-orange-100 text-sm">Student engagement</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end space-x-2">
                {weeklyProgress.map((day, index) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center">
                    <motion.div
                      className="w-full bg-blue-500 rounded-t transition-all duration-1000 mb-2"
                      initial={{ height: "0%" }}
                      animate={{ height: `${(day.students / 20) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      style={{ minHeight: "8px" }}
                    />
                    <span className="text-xs text-gray-500">{day.day}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-blue-600" data-testid="weekly-total-students">
                    {weeklyProgress.reduce((sum, day) => sum + day.students, 0)}
                  </div>
                  <div className="text-gray-500">Students Active</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600" data-testid="weekly-total-assignments">
                    {weeklyProgress.reduce((sum, day) => sum + day.assignments, 0)}
                  </div>
                  <div className="text-gray-500">Assignments</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600" data-testid="weekly-total-tokens">
                    {weeklyProgress.reduce((sum, day) => sum + day.tokens, 0)}
                  </div>
                  <div className="text-gray-500">Tokens Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((student: any, index: number) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center space-x-3"
                    data-testid={`top-performer-${index}`}
                  >
                    <div className="text-lg font-bold text-gray-400 w-6">
                      #{index + 1}
                    </div>
                    <img
                      src={student.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nickname}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                      alt="Student"
                      className="w-10 h-10 rounded-full object-cover"
                      data-testid={`performer-avatar-${index}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800" data-testid={`performer-name-${index}`}>
                        {student.nickname || `${student.firstName} ${student.lastName}`.trim()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {student.level || 1}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600" data-testid={`performer-tokens-${index}`}>
                        {student.tokens?.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-gray-500">tokens</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {topPerformers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-medal text-3xl mb-2"></i>
                  <p>No student data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Assignment Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Assignment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2" data-testid="total-assignments">
                  {stats?.totalAssignments || 0}
                </div>
                <div className="text-gray-600">Total Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2" data-testid="completed-assignments">
                  {stats?.completedAssignments || 0}
                </div>
                <div className="text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2" data-testid="pending-submissions">
                  {stats?.pendingSubmissions || 0}
                </div>
                <div className="text-gray-600">Pending Review</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2" data-testid="average-tokens">
                  {averageTokens}
                </div>
                <div className="text-gray-600">Avg. Tokens/Student</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
