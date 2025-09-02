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

  // Curated challenge options for teachers to choose from
  const curatedChallenges = [
    { id: 'weekly-warrior', name: 'Weekly Warrior', icon: 'fas fa-fire', color: 'red', target: 5, current: 0, description: 'Complete 5 assignments this week' },
    { id: 'perfect-attendance', name: 'Perfect Attendance', icon: 'fas fa-star', color: 'yellow', target: 30, current: 0, description: '30 days of perfect attendance' },
    { id: 'collaboration-master', name: 'Collaboration Master', icon: 'fas fa-handshake', color: 'blue', target: 10, current: 0, description: 'Work with 10 different classmates' },
    { id: 'quality-creator', name: 'Quality Creator', icon: 'fas fa-gem', color: 'purple', target: 3, current: 0, description: 'Submit 3 exemplary assignments' },
    { id: 'helping-mentor', name: 'Peer Mentor', icon: 'fas fa-graduation-cap', color: 'green', target: 5, current: 0, description: 'Help 5 classmates with their work' },
    { id: 'innovation-leader', name: 'Innovation Leader', icon: 'fas fa-rocket', color: 'indigo', target: 1, current: 0, description: 'Propose an approved class improvement' }
  ];

  // Show curated options if no challenges exist
  if (!challenges || challenges.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Challenge Ideas</h3>
          {user?.role === 'teacher' && (
            <Link href="/challenges">
              <span className="text-blue-600 text-sm hover:underline cursor-pointer">Activate</span>
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {curatedChallenges.slice(0, 3).map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className={`w-8 h-8 bg-${challenge.color}-100 rounded-full flex items-center justify-center`}>
                <i className={`${challenge.icon} text-${challenge.color}-600 text-sm`}></i>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-sm" data-testid={`challenge-name-${challenge.id}`}>
                  {challenge.name}
                </p>
                <p className="text-xs text-gray-600">{challenge.description}</p>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                0/{challenge.target}
              </span>
            </motion.div>
          ))}
        </div>
        {user?.role === 'teacher' && (
          <div className="mt-4 text-center">
            <Link href="/challenges">
              <Button size="sm" variant="outline" data-testid="button-create-challenges">
                <Plus className="w-4 h-4 mr-2" />
                Activate Challenges
              </Button>
            </Link>
          </div>
        )}
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
