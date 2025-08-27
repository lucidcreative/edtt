import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import ChallengeManagement from "@/components/challenge-management";
import StudentChallenges from "@/components/student/student-challenges";

export default function Challenges() {
  const { user } = useAuth();
  
  // Show student challenges view for students
  if (user?.role === 'student') {
    return <StudentChallenges />;
  }
  
  const { currentClassroom } = useClassroom();

  if (!currentClassroom) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <i className="fas fa-trophy text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Classroom Selected</h3>
          <p className="text-gray-600">Select a classroom to manage challenges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Challenge Management</h1>
        <p className="text-gray-600 mt-1">Create and manage challenges for {currentClassroom.name}</p>
      </div>
      
      <ChallengeManagement classroomId={currentClassroom.id} />
    </div>
  );
}