import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trophy, 
  Medal, 
  Star, 
  Award, 
  Target, 
  Crown, 
  Users,
  TrendingUp,
  Gift,
  Plus,
  Edit,
  Zap,
  MoreHorizontal,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  id: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  tokens: number;
  level: number;
  totalEarned: number;
  rank: number;
}

export default function TeacherLeaderboard() {
  const { user } = useAuth();
  const { currentClassroom } = useClassroom();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [awardType, setAwardType] = useState<'tokens' | 'badge' | 'challenge'>('tokens');
  const [awardAmount, setAwardAmount] = useState(10);
  const [awardReason, setAwardReason] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  
  // Badge Management State
  const [isBadgeCreateOpen, setIsBadgeCreateOpen] = useState(false);
  const [badgeFormData, setBadgeFormData] = useState({
    name: '', description: '', icon: 'fas fa-star', color: '#f59e0b', category: 'academic'
  });
  
  // Challenge Management State
  const [isChallengeCreateOpen, setIsChallengeCreateOpen] = useState(false);
  const [challengeFormData, setChallengeFormData] = useState({
    title: '', description: '', type: 'individual', targetMetric: 'assignments_completed',
    targetValue: 10, tokenReward: 100, startDate: '', endDate: ''
  });

  // Fetch leaderboard data
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/leaderboard`],
    enabled: !!currentClassroom?.id
  });

  // Fetch classroom stats
  const { data: stats = {} } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/stats`],
    enabled: !!currentClassroom?.id
  });

  // Fetch available badges
  const { data: badges = [] } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/badges`],
    enabled: !!currentClassroom?.id
  });

  // Fetch student badge analytics
  const { data: badgeAnalytics = {} } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/badge-analytics`],
    enabled: !!currentClassroom?.id
  });

  // Fetch challenges for the classroom
  const { data: challenges = [] } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/challenges`],
    enabled: !!currentClassroom?.id
  });

  // Fetch challenge analytics
  const { data: challengeAnalytics = {} } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/challenge-analytics`],
    enabled: !!currentClassroom?.id
  });

  // Award tokens mutation
  const awardTokensMutation = useMutation({
    mutationFn: async ({ studentId, amount, reason }: { studentId: string; amount: number; reason: string }) => {
      const response = await apiRequest('POST', `/api/students/${studentId}/award-tokens`, {
        amount,
        reason
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/leaderboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/stats`] });
      setIsAwardDialogOpen(false);
      resetAwardForm();
    }
  });

  // Award badge mutation
  const awardBadgeMutation = useMutation({
    mutationFn: async ({ studentId, badgeId, reason }: { studentId: string; badgeId: string; reason: string }) => {
      const response = await apiRequest('POST', `/api/students/${studentId}/award-badge`, {
        badgeId,
        reason
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/badge-analytics`] });
      setIsAwardDialogOpen(false);
      resetAwardForm();
    }
  });

  // Badge creation mutation
  const createBadgeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/classrooms/${currentClassroom?.id}/badges`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/badges`] });
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/badge-analytics`] });
      setIsBadgeCreateOpen(false);
      setBadgeFormData({ name: '', description: '', icon: 'fas fa-star', color: '#f59e0b', category: 'academic' });
      toast({ title: "Badge created!", description: "Your new badge has been added to the classroom." });
    }
  });

  // Challenge creation mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/classrooms/${currentClassroom?.id}/challenges`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/challenges`] });
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/challenge-analytics`] });
      setIsChallengeCreateOpen(false);
      setChallengeFormData({
        title: '', description: '', type: 'individual', targetMetric: 'assignments_completed',
        targetValue: 10, tokenReward: 100, startDate: '', endDate: ''
      });
      toast({ title: "Challenge created!", description: "Your new challenge has been added to the classroom." });
    }
  });

  const resetAwardForm = () => {
    setAwardAmount(10);
    setAwardReason('');
    setSelectedBadgeId('');
    setSelectedStudent(null);
  };

  const handleAward = () => {
    if (!selectedStudent) return;
    
    if (awardType === 'tokens') {
      awardTokensMutation.mutate({
        studentId: selectedStudent.id,
        amount: awardAmount,
        reason: awardReason
      });
    } else if (awardType === 'badge' && selectedBadgeId) {
      awardBadgeMutation.mutate({
        studentId: selectedStudent.id,
        badgeId: selectedBadgeId,
        reason: awardReason
      });
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <Trophy className="h-5 w-5 text-gray-300" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "from-yellow-400 to-orange-500";
      case 2: return "from-gray-300 to-gray-500";
      case 3: return "from-amber-400 to-amber-600";
      default: return "from-blue-400 to-purple-500";
    }
  };

  if (!currentClassroom) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classroom Selected</h3>
          <p className="text-gray-600">Select a classroom to view the leaderboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Student Leaderboard & Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track student progress, award tokens, badges, and manage achievements
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Total Tokens</p>
                <p className="text-2xl font-bold">{stats.totalTokens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total Badges</p>
                <p className="text-2xl font-bold">{stats.totalBadges || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Challenges</p>
                <p className="text-2xl font-bold">{stats.activeChallenges || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Student Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="w-16 h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((student: LeaderboardEntry, index: number) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={cn(
                        "flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-all duration-200",
                        student.rank <= 3 ? "bg-gradient-to-r opacity-90" : "hover:bg-gray-50"
                      )}
                      style={
                        student.rank <= 3 ? {
                          backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                          '--tw-gradient-from': '#fef3c7',
                          '--tw-gradient-to': '#fde68a',
                        } : {}
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-r",
                          getRankColor(student.rank)
                        )}>
                          {student.rank <= 3 ? (
                            getRankIcon(student.rank)
                          ) : (
                            <span className="text-sm">{student.rank}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {student.nickname}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              {student.tokens} tokens
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-blue-500" />
                              Level {student.level}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsAwardDialogOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Gift className="h-3 w-3" />
                          Award
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <div className="space-y-6">
            {/* Badge Analytics Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Badge Management & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-purple-600">
                      {badgeAnalytics.totalBadges || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Total Badges</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-green-600">
                      {badgeAnalytics.totalAwards || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Total Awards</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {badgeAnalytics.avgBadgesPerStudent || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Avg per Student</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-orange-600">
                      {stats.totalStudents || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Enhanced Badge Management Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    Badge Management
                  </CardTitle>
                  <Button 
                    onClick={() => setIsBadgeCreateOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                    data-testid="button-create-badge"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Badge
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {badges.map((badge: any) => (
                    <div key={badge.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: badge.color }}
                        >
                          <i className={badge.icon}></i>
                        </div>
                        <div>
                          <h4 className="font-semibold">{badge.name}</h4>
                          <p className="text-sm text-gray-600">{badge.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={badge.isActive}
                          onCheckedChange={(checked) => {
                            toast({ title: "Badge updated", description: `${badge.name} is now ${checked ? 'active' : 'inactive'}` });
                          }}
                          data-testid={`switch-badge-${badge.id}`}
                        />
                        <Button size="sm" variant="outline" data-testid={`button-edit-badge-${badge.id}`}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" data-testid={`button-delete-badge-${badge.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {badges.length === 0 && (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Badges Created</h3>
                      <p className="text-gray-600 mb-4">Create your first badge to start recognizing student achievements.</p>
                      <Button 
                        onClick={() => setIsBadgeCreateOpen(true)}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Badge
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <div className="space-y-6">
            {/* Challenge Analytics Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Challenge Management & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-green-600">
                      {challengeAnalytics.totalChallenges || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Total Challenges</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {challengeAnalytics.activeChallenges || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Active Challenges</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-purple-600">
                      {challengeAnalytics.completedChallenges || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h3 className="text-2xl font-bold text-orange-600">
                      {challengeAnalytics.avgParticipation || 0}%
                    </h3>
                    <p className="text-sm text-gray-600">Participation Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Enhanced Challenge Management Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Challenge Management
                  </CardTitle>
                  <Button 
                    onClick={() => setIsChallengeCreateOpen(true)}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    data-testid="button-create-challenge"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Challenge
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {challenges.map((challenge: any) => (
                    <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: challenge.color || '#10b981' }}
                        >
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{challenge.title}</h4>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-green-600">🪙 {challenge.tokenReward} tokens</span>
                            <span className="text-xs text-blue-600">📊 {challenge.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={challenge.isActive}
                          onCheckedChange={(checked) => {
                            toast({ title: "Challenge updated", description: `${challenge.title} is now ${checked ? 'active' : 'inactive'}` });
                          }}
                          data-testid={`switch-challenge-${challenge.id}`}
                        />
                        <Button size="sm" variant="outline" data-testid={`button-edit-challenge-${challenge.id}`}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" data-testid={`button-delete-challenge-${challenge.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {challenges.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Challenges Created</h3>
                      <p className="text-gray-600 mb-4">Create your first challenge to motivate students with goals and rewards.</p>
                      <Button 
                        onClick={() => setIsChallengeCreateOpen(true)}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Challenge
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Tokens</span>
                    <span className="font-medium">{stats.avgTokens || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Circulating</span>
                    <span className="font-medium">{stats.totalTokens || 0}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Challenges</span>
                    <span className="font-medium">{stats.activeChallenges || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Badge Awards</span>
                    <span className="font-medium">{badgeAnalytics.totalAwards || 0}</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Award Dialog */}
      <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Award Student: {selectedStudent?.nickname}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Award Type</Label>
              <Select value={awardType} onValueChange={(value: any) => setAwardType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tokens">🪙 Tokens</SelectItem>
                  <SelectItem value="badge">🏆 Badge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {awardType === 'tokens' && (
              <div>
                <Label>Token Amount</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={awardAmount}
                  onChange={(e) => setAwardAmount(parseInt(e.target.value) || 1)}
                />
              </div>
            )}

            {awardType === 'badge' && (
              <div>
                <Label>Select Badge</Label>
                <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a badge to award" />
                  </SelectTrigger>
                  <SelectContent>
                    {badges.map((badge: any) => (
                      <SelectItem key={badge.id} value={badge.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{badge.icon}</span>
                          {badge.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                placeholder="Why is this student being rewarded?"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAward}
                disabled={
                  (awardType === 'tokens' && !awardAmount) ||
                  (awardType === 'badge' && !selectedBadgeId) ||
                  awardTokensMutation.isPending ||
                  awardBadgeMutation.isPending
                }
                className="flex-1"
              >
                {(awardTokensMutation.isPending || awardBadgeMutation.isPending) ? "Awarding..." : "Award Student"}
              </Button>
              <Button variant="outline" onClick={() => setIsAwardDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}