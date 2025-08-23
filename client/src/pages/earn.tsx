import { useAuth } from "@/hooks/useAuth";
import StudentEarn from "@/components/student/student-earn";
import { motion } from "framer-motion";

export default function Earn() {
  const { user } = useAuth();
  
  // Show student earn view for students
  if (user?.role === 'student') {
    return <StudentEarn />;
  }
  
  // Show teacher earn management view for teachers
  return (
    <div className="p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-coins text-3xl text-white"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Teacher Earn Management</h3>
        <p className="text-gray-600">Manage assignments and time tracking for your classroom.</p>
      </motion.div>
    </div>
  );
}