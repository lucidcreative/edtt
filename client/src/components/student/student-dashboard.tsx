import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JoinClassroomModal from "./join-classroom-modal";

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

export default function StudentDashboard() {
  const { user } = useAuth();

  // Get student's classroom enrollments
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/students", user?.id, "enrollments"],
    enabled: !!user?.id && user?.role === 'student'
  });

  const approvedClassrooms = (enrollments || []).filter(e => e.enrollmentStatus === 'approved');
  const pendingClassrooms = (enrollments || []).filter(e => e.enrollmentStatus === 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Classrooms</h1>
          <p className="text-gray-600">
            {approvedClassrooms.length > 0 
              ? `You're enrolled in ${approvedClassrooms.length} classroom${approvedClassrooms.length !== 1 ? 's' : ''}`
              : "Join your first classroom to get started"
            }
          </p>
        </div>
        <JoinClassroomModal>
          <Button 
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold"
            data-testid="button-join-new-classroom"
          >
            <i className="fas fa-plus mr-2"></i>
            Join New Classroom
          </Button>
        </JoinClassroomModal>
      </div>

      {/* Active Classrooms */}
      {approvedClassrooms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <i className="fas fa-check-circle text-green-500"></i>
            Active Classrooms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedClassrooms.map((enrollment, index) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {enrollment.classroom.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(enrollment.enrollmentStatus)}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-chalkboard text-white text-sm"></i>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {enrollment.classroom.subject && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="fas fa-book text-blue-500"></i>
                          <span>{enrollment.classroom.subject}</span>
                        </div>
                      )}
                      {enrollment.classroom.gradeLevel && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="fas fa-graduation-cap text-purple-500"></i>
                          <span>Grade {enrollment.classroom.gradeLevel}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="fas fa-calendar text-gray-400"></i>
                        <span>Joined {formatDate(enrollment.enrolledAt)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-coins text-yellow-500"></i>
                          {user?.tokens || 0} tokens
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-level-up-alt text-blue-500"></i>
                          Level {user?.level || 1}
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="group-hover:bg-blue-50 group-hover:border-blue-200"
                        data-testid={`button-enter-classroom-${enrollment.classroom.id}`}
                        onClick={() => {
                          // In a real app, this would navigate to the specific classroom dashboard
                          window.location.href = '/';
                        }}
                      >
                        <i className="fas fa-arrow-right mr-1"></i>
                        Enter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending Approvals */}
      {pendingClassrooms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <i className="fas fa-clock text-yellow-500"></i>
            Waiting for Approval
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingClassrooms.map((enrollment, index) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {enrollment.classroom.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(enrollment.enrollmentStatus)}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-hourglass-half text-white text-sm"></i>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {enrollment.classroom.subject && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="fas fa-book text-blue-500"></i>
                          <span>{enrollment.classroom.subject}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="fas fa-calendar text-gray-400"></i>
                        <span>Requested {formatDate(enrollment.enrolledAt)}</span>
                      </div>
                      <p className="text-sm text-yellow-700 bg-yellow-100 rounded p-2 mt-3">
                        <i className="fas fa-info-circle mr-1"></i>
                        Your teacher will review your request soon. You'll be notified once approved.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {approvedClassrooms.length === 0 && pendingClassrooms.length === 0 && (
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
      )}
    </div>
  );
}