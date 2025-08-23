import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JoinClassroomModal from "./join-classroom-modal";
import MetricCard from "@/components/dashboard/metric-card";

interface Classroom {
  id: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  joinCode: string;
  teacherId: string;
}

interface Enrollment {
  id: string;
  enrollmentStatus: 'pending' | 'approved' | 'denied';
  enrolledAt: string;
  approvedAt?: string;
  classroom: Classroom;
}

interface Assignment {
  id: string;
  title: string;
  status: 'assigned' | 'submitted' | 'graded';
  tokenReward: number;
  dueDate?: string;
}

export default function StudentMainDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Get student's classroom enrollments
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/students", user?.id, "enrollments"],
    enabled: !!user?.id && user?.role === 'student'
  });

  const approvedClassrooms = (enrollments || []).filter(e => e.enrollmentStatus === 'approved');
  const currentClassroom = approvedClassrooms[0];

  // Get assignments for current classroom
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/students", user?.id, "assignments"],
    enabled: !!user?.id && !!currentClassroom
  });

  // Get student progress data
  const { data: progress } = useQuery({
    queryKey: ["/api/students", user?.id, "progress"],
    enabled: !!user?.id && !!currentClassroom
  });

  // Get recent announcements
  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["/api/students", user?.id, "announcements"],
    enabled: !!user?.id && !!currentClassroom
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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

  // If no approved classrooms, show enrollment view
  if (approvedClassrooms.length === 0) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-door-open text-3xl text-white"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Learn?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Join your first classroom to start earning tokens for your achievements and compete with your classmates!
          </p>
          
          <JoinClassroomModal>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="button-join-first-classroom"
            >
              <i className="fas fa-plus mr-2"></i>
              Join Your First Classroom
            </Button>
          </JoinClassroomModal>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <i className="fas fa-question-circle text-blue-500 mt-1"></i>
              <div className="text-left">
                <p className="font-medium text-blue-800 mb-1">Need help?</p>
                <p className="text-sm text-blue-700">
                  Ask your teacher for the classroom join code. It's usually a 6-character code like "ABC123".
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status === 'assigned').length;
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
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.nickname}!</h1>
        <p className="text-gray-600">{currentClassroom.classroom.name} • {currentClassroom.classroom.subject}</p>
      </motion.div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MetricCard
            title="My Tokens"
            value={`${user?.tokens || 0}`}
            subtitle={`Level ${user?.level || 1} • Keep earning!`}
            icon="fas fa-coins"
            gradient="from-yellow-500 to-orange-500"
            onClick={() => setLocation('/store')}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricCard
            title="Assignments"
            value={`${pendingAssignments}`}
            subtitle={pendingAssignments > 0 ? `${pendingAssignments} pending` : "All caught up!"}
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
            title="Progress"
            value={`${completionRate}%`}
            subtitle={`${completedAssignments}/${totalAssignments} completed`}
            icon="fas fa-chart-line"
            gradient="from-green-500 to-emerald-500"
            progress={completionRate}
            onClick={() => setLocation('/progress')}
          />
        </motion.div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Assignments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-tasks text-purple-500"></i>
                  Recent Assignments
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation('/assignments')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.slice(0, 3).map((assignment, index) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{assignment.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={assignment.status === 'assigned' ? 'destructive' : assignment.status === 'submitted' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {assignment.status === 'assigned' ? 'Due' : assignment.status === 'submitted' ? 'Submitted' : 'Graded'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            <i className="fas fa-coins text-yellow-500 mr-1"></i>
                            {assignment.tokenReward} tokens
                          </span>
                        </div>
                      </div>
                      {assignment.status === 'assigned' && (
                        <Button size="sm" onClick={() => setLocation('/assignments')}>
                          Start
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-tasks text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">No assignments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-bullhorn text-blue-500"></i>
                  Announcements
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation('/announcements')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.slice(0, 3).map((announcement: any, index: number) => (
                    <div key={announcement.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="font-medium text-gray-800">{announcement.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-bullhorn text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">No announcements yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Classroom Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-500"></i>
              Classroom Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <i className="fas fa-chalkboard text-2xl text-blue-500 mb-2"></i>
                <p className="font-medium text-gray-800">{currentClassroom.classroom.name}</p>
                <p className="text-sm text-gray-600">{currentClassroom.classroom.subject}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <i className="fas fa-graduation-cap text-2xl text-purple-500 mb-2"></i>
                <p className="font-medium text-gray-800">Grade {currentClassroom.classroom.gradeLevel}</p>
                <p className="text-sm text-gray-600">Your level</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <i className="fas fa-users text-2xl text-green-500 mb-2"></i>
                <p className="font-medium text-gray-800">Active Student</p>
                <p className="text-sm text-gray-600">Enrolled status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}