import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import RosterManagement from "@/components/classroom/roster-management";

export default function StudentManagement() {
  const { user } = useAuth();

  // Get user's classrooms
  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  const currentClassroom = classrooms?.[0];

  if (classroomsLoading) {
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

  return (
    <div className="p-4 lg:p-6">
      <RosterManagement 
        classroomId={currentClassroom.id} 
        classroomName={currentClassroom.name}
        joinCode={currentClassroom.joinCode || currentClassroom.code}
      />
    </div>
  );
}