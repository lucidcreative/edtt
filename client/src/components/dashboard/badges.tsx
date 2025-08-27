import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BadgesProps {
  classroomId: string;
}


export default function Badges({ classroomId }: BadgesProps) {
  const { user } = useAuth();

  const { data: badges } = useQuery({
    queryKey: ["/api/classrooms", classroomId, "badges"],
    enabled: !!classroomId
  });

  // Only show real badges data
  if (!badges || badges.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Badges</h3>
          <Link href="/badges">
            <span className="text-blue-600 text-sm hover:underline cursor-pointer">Manage</span>
          </Link>
        </div>
        <div className="text-center py-8">
          <i className="fas fa-award text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-sm mb-6">No badges created yet</p>
          <Link href="/badges">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white" data-testid="button-create-badges">
              <Plus className="w-4 h-4 mr-2" />
              Create Badges
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Badges</h3>
        <Link href="/badges">
          <span className="text-blue-600 text-sm hover:underline cursor-pointer">Manage</span>
        </Link>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {badges.slice(0, 4).map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <motion.div
              className={`w-12 h-12 bg-${badge.color}-100 rounded-full flex items-center justify-center mb-1 mx-auto cursor-pointer`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              data-testid={`badge-${badge.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <i className={`${badge.icon} text-${badge.color}-600`}></i>
            </motion.div>
            <p className="text-xs text-gray-600 leading-tight">{badge.name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
