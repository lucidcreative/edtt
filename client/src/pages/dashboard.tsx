import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import MetricCard from "@/components/dashboard/metric-card";
import CategorySelector from "@/components/dashboard/category-selector";
import ProgressChart from "@/components/dashboard/progress-chart";
import Leaderboard from "@/components/dashboard/leaderboard";
import Badges from "@/components/dashboard/badges";
import Challenges from "@/components/dashboard/challenges";
import IncomeCard from "@/components/dashboard/income-card";
import CreateClassroomModal from "@/components/classroom/create-classroom-modal";
import StudentDashboard from "@/components/student/student-dashboard";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();

  // Show student dashboard for students
  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  // Get user's classrooms
  const { data: classrooms } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  const currentClassroom = classrooms?.[0]; // For now, use the first classroom

  // Get classroom stats for teachers
  const { data: stats } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "stats"],
    enabled: !!currentClassroom && user?.role === 'teacher'
  });

  // Get leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "leaderboard"],
    enabled: !!currentClassroom
  });

  if (!currentClassroom) {
    return (
      <div className="p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-chalkboard text-3xl text-white"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {user?.role === 'teacher' 
              ? "Welcome to BizCoin!"
              : "Join Your First Classroom"
            }
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {user?.role === 'teacher' 
              ? "Create your first classroom to start building an engaging token economy for your students."
              : "Enter a classroom code to join and start earning tokens for your achievements."
            }
          </p>
          
          {user?.role === 'teacher' ? (
            <CreateClassroomModal>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                data-testid="button-create-first-classroom"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Your First Classroom
              </Button>
            </CreateClassroomModal>
          ) : (
            <Button 
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="button-join-classroom"
              onClick={() => window.location.href = '/join'}
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Join a Classroom
            </Button>
          )}
          
          {user?.role === 'teacher' && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                <div className="text-left">
                  <p className="font-medium text-blue-800 mb-1">Getting Started Tips</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Set up your classroom with subject and grade level</li>
                    <li>• Create assignments and store items</li>
                    <li>• Share the join code with your students</li>
                    <li>• Watch engagement soar with token rewards!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const completionPercentage = stats ? Math.round((stats.completedAssignments / Math.max(stats.totalAssignments, 1)) * 100) : 56;
  const assignmentText = stats ? `${stats.completedAssignments}/${stats.totalAssignments}` : "12/20";
  const progressText = user?.tokens ? `${user.tokens}/150` : "120/150";

  return (
    <div className="p-4 lg:p-6 space-y-8">
      {/* First Row - Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MetricCard
            title="Completed"
            value={`${completionPercentage}%`}
            subtitle="+12% from last week"
            icon="fas fa-check-circle"
            gradient="from-blue-500 to-blue-600"
            progress={completionPercentage}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricCard
            title="Assignments"
            value={assignmentText}
            subtitle={stats ? `${stats.pendingSubmissions} pending review` : "8 pending review"}
            icon="fas fa-tasks"
            gradient="from-purple-500 to-purple-600"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MetricCard
            title="Progress"
            value={progressText}
            subtitle="30 points to goal"
            icon="fas fa-chart-line"
            gradient="from-pink-500 to-rose-500"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Leaderboard students={leaderboard} />
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <CategorySelector />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ProgressChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <IncomeCard tokens={user?.tokens || 0} />
        </motion.div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Badges classroomId={currentClassroom.id} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Challenges classroomId={currentClassroom.id} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <i className="fas fa-trophy text-yellow-600 text-2xl animate-bounce"></i>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <i className="fas fa-star text-blue-600 text-2xl"></i>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
