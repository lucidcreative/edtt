import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function StudentManagement() {
  const { user } = useAuth();

  // Get user's classrooms
  const { data: classrooms } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  const currentClassroom = classrooms?.[0];

  // Get classroom students
  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "students"],
    enabled: !!currentClassroom
  });

  if (!currentClassroom) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Classroom Found</h3>
          <p className="text-gray-600">Create a classroom to manage students.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Student Management</h2>
              <p className="text-gray-600 mt-1">
                {currentClassroom.name} • {students?.length || 0} students
              </p>
            </div>
            {user?.role === 'teacher' && (
              <div className="flex space-x-3">
                <Button variant="outline" data-testid="button-bulk-add">
                  <i className="fas fa-upload mr-2"></i>
                  Bulk Add (CSV)
                </Button>
                <Button data-testid="button-add-student">
                  <i className="fas fa-plus mr-2"></i>
                  Add Student
                </Button>
              </div>
            )}
          </div>
        </div>

        {students?.length === 0 ? (
          <div className="p-12 text-center">
            <i className="fas fa-user-plus text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Students Yet</h3>
            <p className="text-gray-600 mb-4">
              Share the classroom code <strong>{currentClassroom.code}</strong> with students to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {user?.role === 'teacher' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students?.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50 transition-colors"
                    data-testid={`student-row-${index}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={student.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nickname}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                          alt="Student"
                          className="w-10 h-10 rounded-full mr-3 object-cover"
                          data-testid={`student-avatar-${index}`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900" data-testid={`student-name-${index}`}>
                            {student.nickname || `${student.firstName} ${student.lastName}`.trim()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Joined {new Date(student.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900" data-testid={`student-tokens-${index}`}>
                        {student.tokens?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" data-testid={`student-level-${index}`}>
                        Level {student.level || 1}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={student.isActive ? "default" : "secondary"}
                        className={student.isActive ? "bg-green-100 text-green-800" : ""}
                        data-testid={`student-status-${index}`}
                      >
                        {student.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    {user?.role === 'teacher' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          data-testid={`button-edit-${index}`}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-900"
                          data-testid={`button-reset-pin-${index}`}
                        >
                          Reset PIN
                        </Button>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
