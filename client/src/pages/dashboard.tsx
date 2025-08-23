import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import MetricCard from "@/components/dashboard/metric-card";
import ClassroomSwitcher from "@/components/dashboard/classroom-switcher";
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
  const [, setLocation] = useLocation();
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);

  // Show student dashboard for students
  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  // Get user's classrooms
  const { data: classrooms = [] } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  // Auto-select first classroom when available
  const currentClassroom = selectedClassroom || classrooms[0];
  
  // Update selected classroom when classrooms load
  if (!selectedClassroom && classrooms.length > 0) {
    setSelectedClassroom(classrooms[0]);
  }

  // Get classroom stats for teachers - ONLY real data, no fake data
  const { data: stats } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "stats"],
    enabled: !!currentClassroom && user?.role === 'teacher'
  });

  // Get leaderboard - ONLY real data, no fake data
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "leaderboard"],
    enabled: !!currentClassroom
  });

  // Get real student count
  const { data: students = [] } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "students"],
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

  // Use ONLY real data - no fake data loading
  const completionPercentage = stats ? Math.round((stats.completedAssignments / Math.max(stats.totalAssignments, 1)) * 100) : 0;
  const assignmentText = stats ? `${stats.completedAssignments}/${stats.totalAssignments}` : "0/0";
  const progressText = user?.tokens ? `${user.tokens}` : "0";
  const studentCount = students?.length || 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header with Classroom Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <ClassroomSwitcher 
          currentClassroom={currentClassroom}
          onClassroomChange={setSelectedClassroom}
        />
      </motion.div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MetricCard
            title="Completion Rate"
            value={stats ? `${completionPercentage}%` : "No data"}
            subtitle={stats ? `${stats.completedAssignments} completed` : "Create assignments to track progress"}
            icon="fas fa-check-circle"
            gradient="from-blue-500 to-blue-600"
            progress={completionPercentage}
            onClick={() => setLocation('/assignments')}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricCard
            title="Assignments"
            value={stats ? assignmentText : "0/0"}
            subtitle={stats ? `${stats.pendingSubmissions || 0} pending review` : "No assignments yet"}
            icon="fas fa-tasks"
            gradient="from-purple-500 to-purple-600"
            onClick={() => setLocation('/assignments')}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MetricCard
            title="Students"
            value={`${studentCount}`}
            subtitle={studentCount > 0 ? `${studentCount} enrolled` : "Share join code to get students"}
            icon="fas fa-users"
            gradient="from-green-500 to-emerald-500"
            onClick={() => setLocation('/students')}
          />
        </motion.div>

      </div>

      {/* Data Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ProgressChart classroomStats={stats} students={students} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Leaderboard students={students} />
        </motion.div>
      </div>

      {/* Classroom Management Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}
