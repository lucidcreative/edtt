import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface BadgesProps {
  classroomId: string;
}

const mockBadges = [
  { id: '1', name: 'Community Helper', icon: 'fas fa-hands-helping', color: 'green' },
  { id: '2', name: 'Quiz Master', icon: 'fas fa-graduation-cap', color: 'blue' },
  { id: '3', name: 'Leadership Pro', icon: 'fas fa-crown', color: 'purple' },
  { id: '4', name: 'Reading Pro', icon: 'fas fa-heart', color: 'red' },
];

export default function Badges({ classroomId }: BadgesProps) {
  const { user } = useAuth();

  const { data: badges } = useQuery({
    queryKey: ["/api/classrooms", classroomId, "badges"],
    enabled: !!classroomId
  });

  const displayBadges = badges?.length > 0 ? badges : mockBadges;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Badges</h3>
        <a href="#" className="text-blue-600 text-sm hover:underline">View all</a>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {displayBadges.slice(0, 4).map((badge, index) => (
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
