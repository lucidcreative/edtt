import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ChallengesProps {
  classroomId: string;
}


export default function Challenges({ classroomId }: ChallengesProps) {
  const { user } = useAuth();

  const { data: challenges } = useQuery({
    queryKey: ["/api/classrooms", classroomId, "challenges"],
    enabled: !!classroomId
  });

  // Only show real challenges data
  if (!challenges || challenges.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Challenges</h3>
          <Link href="/challenges">
            <span className="text-blue-600 text-sm hover:underline cursor-pointer">Manage</span>
          </Link>
        </div>
        <div className="text-center py-8">
          <i className="fas fa-trophy text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-sm mb-6">No challenges created yet</p>
          <Link href="/challenges">
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" data-testid="button-create-challenges">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenges
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Challenges</h3>
        <Link href="/challenges">
          <span className="text-blue-600 text-sm hover:underline cursor-pointer">Manage</span>
        </Link>
      </div>
      
      <div className="space-y-3">
        {challenges.slice(0, 2).map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3"
          >
            <div className={`w-6 h-6 bg-${challenge.color}-500 rounded-full flex items-center justify-center`}>
              <i className={`${challenge.icon} text-white text-xs`}></i>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800" data-testid={`challenge-name-${index}`}>
                {challenge.name}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <motion.div
                  className={`bg-${challenge.color}-500 h-2 rounded-full`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${challenge.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                />
              </div>
            </div>
            <span className="text-sm text-gray-600" data-testid={`challenge-progress-${index}`}>
              {challenge.current}/{challenge.target}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
