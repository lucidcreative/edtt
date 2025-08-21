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
  const topStudents = students.slice(0, 3);

  // Mock data if no students provided
  const mockStudents = [
    { id: '1', nickname: 'Jada Johnson', tokens: 2550, profileImageUrl: null },
    { id: '2', nickname: 'Braden Lee', tokens: 2120, profileImageUrl: null },
    { id: '3', nickname: 'Sarah Brown', tokens: 1900, profileImageUrl: null },
  ];

  const displayStudents = topStudents.length > 0 ? topStudents : mockStudents;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Leaderboard</h3>
      <div className="space-y-3">
        {displayStudents.map((student, index) => (
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
