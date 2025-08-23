import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import { motion } from "framer-motion";
import { Clock, Play, Square, Settings, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TimeTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { currentClassroom } = useClassroom();

  // Get time tracking settings for current classroom
  const { data: timeSettings } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "time-settings"],
    enabled: !!currentClassroom && user?.role === 'teacher'
  });

  // Get student's active time entry
  const { data: activeEntry } = useQuery({
    queryKey: ["/api/time-entries/active", currentClassroom?.id],
    enabled: !!currentClassroom && user?.role === 'student',
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get time tracking history
  const { data: timeHistory = [] } = useQuery({
    queryKey: ["/api/time-entries", currentClassroom?.id],
    enabled: !!currentClassroom
  });

  // Get today's total hours for safety check
  const { data: todayHours = 0 } = useQuery({
    queryKey: ["/api/time-entries/today", currentClassroom?.id],
    enabled: !!currentClassroom && user?.role === 'student'
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/classrooms/${currentClassroom?.id}/clock-in`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Clocked In", description: "You're now tracking time and earning tokens!" });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/today"] });
    },
    onError: (error: any) => {
      toast({ title: "Clock In Failed", description: error.message, variant: "destructive" });
    }
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/classrooms/${currentClassroom?.id}/clock-out`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Clocked Out", 
        description: `Session complete! You earned ${data.tokensEarned} tokens for ${Math.round(data.totalMinutes / 60 * 100) / 100} hours.` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
    onError: (error: any) => {
      toast({ title: "Clock Out Failed", description: error.message, variant: "destructive" });
    }
  });

  // Update time tracking settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest('PUT', `/api/classrooms/${currentClassroom?.id}/time-settings`, settings);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Settings Updated", description: "Time tracking settings have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", currentClassroom?.id, "time-settings"] });
      setIsSettingsOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getActiveDuration = () => {
    if (!activeEntry?.clockInTime) return 0;
    const start = new Date(activeEntry.clockInTime);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
  };

  // Safety checks
  const maxHours = timeSettings?.maxDailyHours || 8;
  const hoursToday = todayHours + (getActiveDuration() / 60);
  const nearingLimit = hoursToday > maxHours * 0.8;
  const exceedsLimit = hoursToday >= maxHours;

  if (!currentClassroom) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Classroom Available</h3>
          <p className="text-gray-600">Join or create a classroom to access time tracking.</p>
        </div>
      </div>
    );
  }

  // Teacher hasn't enabled time tracking
  if (user?.role === 'student' && !timeSettings?.timeTrackingEnabled) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Time Tracking Not Available</h3>
          <p className="text-gray-600">Your teacher hasn't enabled time tracking for this classroom yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Time Clock
          </h1>
          <p className="text-gray-600">{currentClassroom.name}</p>
        </div>
        
        {user?.role === 'teacher' && (
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Time Tracking Settings</DialogTitle>
              </DialogHeader>
              <TimeTrackingSettings 
                settings={timeSettings}
                onUpdate={(settings) => updateSettingsMutation.mutate(settings)}
                isLoading={updateSettingsMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Time Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl font-mono font-bold text-blue-700 mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-blue-600">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </CardContent>
      </Card>

      {/* Student Clock In/Out Interface */}
      {user?.role === 'student' && timeSettings?.timeTrackingEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Time Session</span>
              {nearingLimit && (
                <Badge variant={exceedsLimit ? "destructive" : "secondary"} className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {exceedsLimit ? "Daily limit reached" : "Nearing daily limit"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active session or clock in */}
            {activeEntry ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-800 font-medium">Currently Clocked In</span>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Active
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Started:</span>
                      <p className="font-mono">{new Date(activeEntry.clockInTime).toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <span className="text-green-700">Duration:</span>
                      <p className="font-mono font-bold">{formatDuration(getActiveDuration())}</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => clockOutMutation.mutate()}
                  disabled={clockOutMutation.isPending}
                  className="w-full bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                  size="lg"
                >
                  <Square className="h-5 w-5" />
                  {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Ready to start earning tokens?</p>
                  <p className="text-sm text-gray-500">
                    Earn {timeSettings?.tokensPerHour || 5} tokens per hour
                  </p>
                </div>
                
                <Button 
                  onClick={() => clockInMutation.mutate()}
                  disabled={clockInMutation.isPending || exceedsLimit}
                  className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                  size="lg"
                >
                  <Play className="h-5 w-5" />
                  {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                </Button>
                
                {exceedsLimit && (
                  <p className="text-sm text-red-600 text-center">
                    You've reached your daily limit of {maxHours} hours
                  </p>
                )}
              </div>
            )}

            {/* Today's Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Today's Progress</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Hours Today:</span>
                  <p className="font-bold">{Math.round(hoursToday * 100) / 100}h / {maxHours}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Tokens Earned:</span>
                  <p className="font-bold text-green-600">
                    {Math.floor(hoursToday * (timeSettings?.tokensPerHour || 5))}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      exceedsLimit ? 'bg-red-500' : nearingLimit ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((hoursToday / maxHours) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {user?.role === 'teacher' ? 'All Time Entries' : 'Your Time History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeHistory.length > 0 ? (
            <div className="space-y-2">
              {timeHistory.slice(0, 10).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {user?.role === 'teacher' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {entry.student?.nickname?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div>
                      {user?.role === 'teacher' && (
                        <p className="font-medium text-gray-800">{entry.student?.nickname}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {new Date(entry.clockInTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDuration(entry.totalMinutes || 0)}</p>
                    <p className="text-sm text-green-600">+{entry.tokensEarned || 0} tokens</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No time entries yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Settings component for teachers
function TimeTrackingSettings({ settings, onUpdate, isLoading }: {
  settings: any;
  onUpdate: (settings: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    timeTrackingEnabled: settings?.timeTrackingEnabled || false,
    maxDailyHours: settings?.maxDailyHours || 8,
    tokensPerHour: settings?.tokensPerHour || 5,
    minClockInDuration: settings?.minClockInDuration || 15
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="enabled">Enable Time Tracking</Label>
          <p className="text-sm text-gray-500">Allow students to clock in and earn tokens</p>
        </div>
        <Switch
          id="enabled"
          checked={formData.timeTrackingEnabled}
          onCheckedChange={(checked) => setFormData({ ...formData, timeTrackingEnabled: checked })}
        />
      </div>
      
      {formData.timeTrackingEnabled && (
        <>
          <div>
            <Label htmlFor="maxHours">Maximum Daily Hours</Label>
            <Input
              id="maxHours"
              type="number"
              step="0.5"
              min="1"
              max="12"
              value={formData.maxDailyHours}
              onChange={(e) => setFormData({ ...formData, maxDailyHours: parseFloat(e.target.value) || 8 })}
              placeholder="8"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum hours a student can work per day</p>
          </div>
          
          <div>
            <Label htmlFor="tokensPerHour">Tokens Per Hour</Label>
            <Input
              id="tokensPerHour"
              type="number"
              min="1"
              max="50"
              value={formData.tokensPerHour}
              onChange={(e) => setFormData({ ...formData, tokensPerHour: parseInt(e.target.value) || 5 })}
              placeholder="5"
            />
            <p className="text-xs text-gray-500 mt-1">BizCoin tokens earned per hour of work</p>
          </div>
          
          <div>
            <Label htmlFor="minDuration">Minimum Session (minutes)</Label>
            <Input
              id="minDuration"
              type="number"
              min="5"
              max="60"
              value={formData.minClockInDuration}
              onChange={(e) => setFormData({ ...formData, minClockInDuration: parseInt(e.target.value) || 15 })}
              placeholder="15"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum time before students can clock out</p>
          </div>
        </>
      )}
      
      <Button 
        onClick={() => onUpdate(formData)}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}