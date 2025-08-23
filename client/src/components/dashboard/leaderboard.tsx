import { motion } from "framer-motion";

interface Student {
  id: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
  tokens: number;
  profileImageUrl?: string;
}

interface LeaderboardProps {
  students?: Student[];
}

export default function Leaderboard({ students = [] }: LeaderboardProps) {
  // Sort students by tokens (highest first) and take top 3
  const topStudents = students
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 3);

  // Only show leaderboard if there are real students
  if (topStudents.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Leaderboard</h3>
        <div className="text-center py-8">
          <i className="fas fa-trophy text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-500 text-sm">No students enrolled yet</p>
          <p className="text-gray-400 text-xs mt-1">Leaderboard will appear once students join and earn tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Leaderboard</h3>
      <div className="space-y-3">
        {topStudents.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3"
          >
            <img
              src={student.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nickname}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
              alt="Student"
              className="w-8 h-8 rounded-full object-cover"
              data-testid={`leaderboard-avatar-${index}`}
            />
            <div className="flex-1">
              <p className="font-medium text-gray-800" data-testid={`leaderboard-name-${index}`}>
                {student.nickname || `${student.firstName} ${student.lastName}`.trim()}
              </p>
              <p className="text-sm text-gray-600" data-testid={`leaderboard-tokens-${index}`}>
                {student.tokens.toLocaleString()}
              </p>
            </div>
            <span className="text-lg">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
