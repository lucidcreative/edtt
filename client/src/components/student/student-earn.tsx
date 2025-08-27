import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StudentAssignments from "./student-assignments";
import StudentTimeTracking from "./student-time-tracking";

export default function StudentEarn() {
  const [activeTab, setActiveTab] = useState("assignments");

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
            <i className="fas fa-coins text-white text-xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Earn Tokens</h1>
        </div>
        <p className="text-gray-600">Complete assignments and track time to earn BizCoin tokens!</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl h-14">
            <TabsTrigger 
              value="assignments" 
              className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
              data-testid="tab-assignments"
            >
              <i className="fas fa-tasks text-lg"></i>
              <span className="hidden sm:inline">Assignments</span>
              <span className="sm:hidden">Work</span>
            </TabsTrigger>
            <TabsTrigger 
              value="time-tracking" 
              className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
              data-testid="tab-time-tracking"
            >
              <i className="fas fa-clock text-lg"></i>
              <span className="hidden sm:inline">Time Clock</span>
              <span className="sm:hidden">Clock</span>
            </TabsTrigger>
          </TabsList>

          {/* Assignment Tab Content */}
          <TabsContent value="assignments" className="mt-6 space-y-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StudentAssignments />
            </motion.div>
          </TabsContent>

          {/* Time Tracking Tab Content */}
          <TabsContent value="time-tracking" className="mt-6 space-y-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StudentTimeTracking />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}