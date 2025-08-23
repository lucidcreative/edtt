import { useAuth } from "@/hooks/useAuth";
import StudentEarn from "@/components/student/student-earn";
import { motion } from "framer-motion";

export default function Earn() {
  const { user } = useAuth();
  
  // Only students can access the earn page
  if (user?.role !== 'student') {
    return (
      <div className="p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-lock text-3xl text-white"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Access Restricted</h3>
          <p className="text-gray-600">This page is only available to students.</p>
        </motion.div>
      </div>
    );
  }
  
  return <StudentEarn />;
}