import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StudentBadges from "@/components/student/student-badges";
import StudentChallenges from "@/components/student/student-challenges";
import StudentProgressView from "@/pages/progress";

export default function Leaderboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("progress");

  // Show student leaderboard view for students
  if (user?.role === 'student') {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-trophy text-white text-xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Leaderboard</h1>
          </div>
          <p className="text-gray-600">Track your progress, badges, and challenge achievements!</p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl h-14">
              <TabsTrigger 
                value="progress" 
                className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                data-testid="tab-progress"
              >
                <i className="fas fa-chart-line text-lg"></i>
                <span className="hidden sm:inline">Progress</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger 
                value="badges" 
                className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                data-testid="tab-badges"
              >
                <i className="fas fa-award text-lg"></i>
                <span className="hidden sm:inline">Badges</span>
                <span className="sm:hidden">Awards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="challenges" 
                className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                data-testid="tab-challenges"
              >
                <i className="fas fa-trophy text-lg"></i>
                <span className="hidden sm:inline">Challenges</span>
                <span className="sm:hidden">Goals</span>
              </TabsTrigger>
            </TabsList>

            {/* Progress Tab Content */}
            <TabsContent value="progress" className="mt-6 space-y-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StudentProgressView />
              </motion.div>
            </TabsContent>

            {/* Badges Tab Content */}
            <TabsContent value="badges" className="mt-6 space-y-0">
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StudentBadges />
              </motion.div>
            </TabsContent>

            {/* Challenges Tab Content */}
            <TabsContent value="challenges" className="mt-6 space-y-0">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StudentChallenges />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    );
  }

  // Teacher view - show classroom leaderboard management
  return (
    <div className="p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-trophy text-3xl text-white"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Teacher Leaderboard</h3>
        <p className="text-gray-600">View and manage student progress, badges, and challenges.</p>
      </motion.div>
    </div>
  );
}