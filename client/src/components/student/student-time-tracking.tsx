import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TimeEntry {
  id: string;
  clockInTime: string;
  clockOutTime?: string;
  duration?: number;
  date: string;
}

export default function StudentTimeTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isActivateSessionView, setIsActivateSessionView] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get student's time entries
  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/students", user?.id, "time-entries"],
    enabled: !!user?.id && user?.role === 'student'
  });

  // Get current active session
  const { data: activeSession } = useQuery({
    queryKey: ["/api/students", user?.id, "active-session"],
    enabled: !!user?.id && user?.role === 'student',
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/time-tracking/clock-in', {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Clocked In", description: "You're now clocked in! Good luck with your work." });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "active-session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "time-entries"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to clock in. Please try again.", variant: "destructive" });
    }
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/time-tracking/clock-out', {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Clocked Out", description: "Session complete! Great work today." });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "active-session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "time-entries"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to clock out. Please try again.", variant: "destructive" });
    }
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateSessionDuration = () => {
    if (!activeSession?.clockInTime) return 0;
    const clockIn = new Date(activeSession.clockInTime);
    const now = new Date();
    return Math.floor((now.getTime() - clockIn.getTime()) / (1000 * 60)); // in minutes
  };

  const totalHoursThisWeek = timeEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return entryDate >= weekStart;
    })
    .reduce((total, entry) => total + (entry.duration || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800">Time Clock</h1>
        <p className="text-gray-600 mt-1">Track your classroom time and stay organized</p>
      </motion.div>

      {/* Current Time Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{formatTime(currentTime)}</div>
              <div className="text-lg opacity-90">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clock In/Out Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className={`fas ${activeSession ? 'fa-play-circle text-green-500' : 'fa-clock text-gray-500'}`}></i>
              {activeSession ? 'Active Session' : 'Ready to Start'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSession ? (
              <div className="space-y-4">
                {/* Clock In Details */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-play-circle text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <p className="font-bold text-green-800 text-lg">Session Active</p>
                      <p className="text-sm text-green-600">You're clocked in and earning time!</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Clock In Time</p>
                      <p className="text-xl font-bold text-green-800">
                        {new Date(activeSession.clockInTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </p>
                      <p className="text-xs text-green-600">
                        {new Date(activeSession.clockInTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Session Duration</p>
                      <p className="text-xl font-bold text-green-800">
                        {formatDuration(calculateSessionDuration())}
                      </p>
                      <p className="text-xs text-green-600">Time earned so far</p>
                    </div>
                  </div>
                </div>
                
                {/* Clock Out Button */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-center mb-3">
                    <p className="text-sm text-red-600 mb-1">Ready to finish your session?</p>
                    <p className="text-xs text-red-500">Click below to clock out and save your time</p>
                  </div>
                  <Button
                    onClick={() => clockOutMutation.mutate()}
                    disabled={clockOutMutation.isPending}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    size="lg"
                    data-testid="button-clock-out"
                  >
                    {clockOutMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Clocking Out...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-stop-circle mr-2"></i>
                        Clock Out & End Session
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-6">
                  <i className="fas fa-clock text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600 mb-4">Ready to start your session?</p>
                </div>
                
                <Button
                  onClick={() => clockInMutation.mutate()}
                  disabled={clockInMutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  size="lg"
                  data-testid="button-clock-in"
                >
                  {clockInMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Clocking In...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play-circle mr-2"></i>
                      Clock In
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Time Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-chart-bar text-blue-500"></i>
              This Week's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {formatDuration(
                    timeEntries
                      .filter(entry => {
                        const entryDate = new Date(entry.date);
                        const weekStart = new Date();
                        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                        return entryDate >= weekStart && entry.clockOutTime; // Only completed sessions
                      })
                      .reduce((total, entry) => total + (entry.duration || 0), 0)
                  )}
                </div>
                <p className="text-sm text-blue-600">Total Time</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {timeEntries.filter(entry => {
                    const entryDate = new Date(entry.date);
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    return entryDate >= weekStart && entry.clockOutTime; // Only completed sessions
                  }).length}
                </div>
                <p className="text-sm text-green-600">Sessions</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {(() => {
                    const completedSessionsThisWeek = timeEntries.filter(entry => {
                      const entryDate = new Date(entry.date);
                      const weekStart = new Date();
                      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                      return entryDate >= weekStart && entry.clockOutTime; // Only completed sessions
                    });
                    const totalMinutes = completedSessionsThisWeek.reduce((total, entry) => total + (entry.duration || 0), 0);
                    return completedSessionsThisWeek.length > 0 ? Math.round(totalMinutes / completedSessionsThisWeek.length) : 0;
                  })()}m
                </div>
                <p className="text-sm text-purple-600">Avg Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Sessions */}
      {timeEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-history text-gray-500"></i>
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeEntries.slice(0, 10).map((entry, index) => {
                  // Create separate entries for clock in and clock out for student view
                  const clockInEntry = (
                    <div key={`${entry.id}-in`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-sign-in-alt text-green-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-green-800">Clock In</p>
                          <p className="text-sm text-green-600">
                            {new Date(entry.date).toLocaleDateString()} at {new Date(entry.clockInTime || entry.date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        <i className="fas fa-play mr-1"></i>
                        Started
                      </Badge>
                    </div>
                  );

                  const clockOutEntry = entry.clockOutTime ? (
                    <div key={`${entry.id}-out`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-sign-out-alt text-red-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-red-800">Clock Out</p>
                          <p className="text-sm text-red-600">
                            {new Date(entry.date).toLocaleDateString()} at {new Date(entry.clockOutTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-red-800">
                          {entry.duration ? formatDuration(entry.duration) : '0m'}
                        </div>
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                          <i className="fas fa-stop mr-1"></i>
                          Complete
                        </Badge>
                      </div>
                    </div>
                  ) : null;

                  return (
                    <div key={entry.id} className="space-y-2">
                      {clockInEntry}
                      {clockOutEntry}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}