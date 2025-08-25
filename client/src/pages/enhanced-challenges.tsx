import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Target, 
  Trophy, 
  Star, 
  Plus, 
  Users, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  Zap,
  PlusCircle,
  Edit,
  Play,
  Pause,
  RotateCcw,
  Medal,
  Crown,
  Timer,
  Gift,
  BookOpen,
  Award,
  Flag,
  Rocket
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: 'individual' | 'team' | 'classroom';
  targetMetric: string;
  targetValue: number;
  tokenReward: number;
  badgeReward?: string;
  duration: string; // '1 week', '2 weeks', '1 month'
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ClassroomChallenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'classroom';
  targetMetric: string;
  targetValue: number;
  tokenReward: number;
  badgeReward?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  progress?: any;
}

const ENHANCED_CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // Academic Excellence Challenges
  {
    id: 'perfect-streak',
    name: 'Perfect Streak',
    description: 'Score 100% on 5 assignments in a row',
    icon: 'fas fa-star',
    color: '#f59e0b',
    type: 'individual',
    targetMetric: 'assignments_completed',
    targetValue: 5,
    tokenReward: 200,
    duration: '2 weeks',
    category: 'academic',
    difficulty: 'hard'
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Submit assignments 1 day before deadline for a week',
    icon: 'fas fa-clock',
    color: '#10b981',
    type: 'individual',
    targetMetric: 'early_submissions',
    targetValue: 5,
    tokenReward: 150,
    duration: '1 week',
    category: 'academic',
    difficulty: 'medium'
  },
  {
    id: 'study-champion',
    name: 'Study Champion',
    description: 'Log 20+ hours of study time this month',
    icon: 'fas fa-book-open',
    color: '#3b82f6',
    type: 'individual',
    targetMetric: 'study_hours',
    targetValue: 20,
    tokenReward: 300,
    duration: '1 month',
    category: 'academic',
    difficulty: 'hard'
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Score above 90% on 8 quizzes',
    icon: 'fas fa-brain',
    color: '#8b5cf6',
    type: 'individual',
    targetMetric: 'quiz_scores',
    targetValue: 8,
    tokenReward: 180,
    duration: '3 weeks',
    category: 'academic',
    difficulty: 'medium'
  },

  // Collaboration & Teamwork
  {
    id: 'team-genius',
    name: 'Team Genius',
    description: 'Complete 3 group projects with excellent ratings',
    icon: 'fas fa-users',
    color: '#06b6d4',
    type: 'team',
    targetMetric: 'group_projects',
    targetValue: 3,
    tokenReward: 250,
    duration: '1 month',
    category: 'collaboration',
    difficulty: 'medium'
  },
  {
    id: 'peer-mentor',
    name: 'Peer Mentor',
    description: 'Help 10 classmates with their assignments',
    icon: 'fas fa-handshake',
    color: '#10b981',
    type: 'individual',
    targetMetric: 'help_sessions',
    targetValue: 10,
    tokenReward: 200,
    duration: '2 weeks',
    category: 'collaboration',
    difficulty: 'easy'
  },
  {
    id: 'discussion-leader',
    name: 'Discussion Leader',
    description: 'Lead 5 meaningful class discussions',
    icon: 'fas fa-comments',
    color: '#f97316',
    type: 'individual',
    targetMetric: 'discussions_led',
    targetValue: 5,
    tokenReward: 175,
    duration: '3 weeks',
    category: 'participation',
    difficulty: 'medium'
  },

  // Participation & Engagement
  {
    id: 'question-machine',
    name: 'Question Machine',
    description: 'Ask 20 thoughtful questions in class',
    icon: 'fas fa-question-circle',
    color: '#ef4444',
    type: 'individual',
    targetMetric: 'questions_asked',
    targetValue: 20,
    tokenReward: 120,
    duration: '2 weeks',
    category: 'participation',
    difficulty: 'easy'
  },
  {
    id: 'attendance-champion',
    name: 'Attendance Champion',
    description: 'Perfect attendance for one month',
    icon: 'fas fa-calendar-check',
    color: '#10b981',
    type: 'individual',
    targetMetric: 'attendance_days',
    targetValue: 30,
    tokenReward: 300,
    duration: '1 month',
    category: 'attendance',
    difficulty: 'medium'
  },
  {
    id: 'active-learner',
    name: 'Active Learner',
    description: 'Participate actively in 15 class sessions',
    icon: 'fas fa-hand-paper',
    color: '#8b5cf6',
    type: 'individual',
    targetMetric: 'active_participation',
    targetValue: 15,
    tokenReward: 160,
    duration: '3 weeks',
    category: 'participation',
    difficulty: 'easy'
  },

  // Creative & Innovation
  {
    id: 'creative-innovator',
    name: 'Creative Innovator',
    description: 'Submit 3 creative project solutions',
    icon: 'fas fa-lightbulb',
    color: '#f59e0b',
    type: 'individual',
    targetMetric: 'creative_projects',
    targetValue: 3,
    tokenReward: 220,
    duration: '1 month',
    category: 'creativity',
    difficulty: 'medium'
  },
  {
    id: 'presentation-pro',
    name: 'Presentation Pro',
    description: 'Deliver 5 outstanding presentations',
    icon: 'fas fa-presentation',
    color: '#06b6d4',
    type: 'individual',
    targetMetric: 'presentations',
    targetValue: 5,
    tokenReward: 190,
    duration: '3 weeks',
    category: 'creativity',
    difficulty: 'medium'
  },

  // Class-wide Challenges
  {
    id: 'classroom-harmony',
    name: 'Classroom Harmony',
    description: 'No behavior incidents for 2 weeks as a class',
    icon: 'fas fa-heart',
    color: '#ef4444',
    type: 'classroom',
    targetMetric: 'behavior_incidents',
    targetValue: 0,
    tokenReward: 500,
    duration: '2 weeks',
    category: 'behavior',
    difficulty: 'medium'
  },
  {
    id: 'knowledge-masters',
    name: 'Knowledge Masters',
    description: 'Class average above 85% on major test',
    icon: 'fas fa-graduation-cap',
    color: '#10b981',
    type: 'classroom',
    targetMetric: 'class_average',
    targetValue: 85,
    tokenReward: 400,
    duration: '1 month',
    category: 'academic',
    difficulty: 'hard'
  },

  // Special Milestone Challenges
  {
    id: 'first-week-warrior',
    name: 'First Week Warrior',
    description: 'Successfully complete your first week',
    icon: 'fas fa-flag',
    color: '#84cc16',
    type: 'individual',
    targetMetric: 'days_active',
    targetValue: 7,
    tokenReward: 100,
    duration: '1 week',
    category: 'milestone',
    difficulty: 'easy'
  },
  {
    id: 'monthly-marathon',
    name: 'Monthly Marathon',
    description: 'Consistent performance for 30 days',
    icon: 'fas fa-calendar-alt',
    color: '#f97316',
    type: 'individual',
    targetMetric: 'consistent_days',
    targetValue: 30,
    tokenReward: 500,
    duration: '1 month',
    category: 'milestone',
    difficulty: 'hard'
  },

  // Technology & Skills
  {
    id: 'tech-wizard',
    name: 'Tech Wizard',
    description: 'Master 5 new digital tools or skills',
    icon: 'fas fa-laptop-code',
    color: '#06b6d4',
    type: 'individual',
    targetMetric: 'tech_skills',
    targetValue: 5,
    tokenReward: 200,
    duration: '1 month',
    category: 'technical',
    difficulty: 'medium'
  },
  {
    id: 'research-master',
    name: 'Research Master',
    description: 'Complete 3 in-depth research projects',
    icon: 'fas fa-search',
    color: '#8b5cf6',
    type: 'individual',
    targetMetric: 'research_projects',
    targetValue: 3,
    tokenReward: 250,
    duration: '1 month',
    category: 'academic',
    difficulty: 'hard'
  }
];

const categoryColors = {
  academic: 'from-blue-500 to-cyan-500',
  collaboration: 'from-green-500 to-emerald-500',
  participation: 'from-orange-500 to-red-500',
  creativity: 'from-pink-500 to-rose-500',
  behavior: 'from-purple-500 to-violet-500',
  attendance: 'from-emerald-500 to-teal-500',
  technical: 'from-cyan-500 to-blue-500',
  milestone: 'from-yellow-500 to-orange-500'
};

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  hard: 'bg-red-100 text-red-800 border-red-200'
};

const typeIcons = {
  individual: '👤',
  team: '👥',
  classroom: '🏫'
};

export default function EnhancedChallenges() {
  const { user } = useAuth();
  const { currentClassroom } = useClassroom();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("active");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChallengeTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'individual' as 'individual' | 'team' | 'classroom',
    targetMetric: 'assignments_completed',
    targetValue: 10,
    tokenReward: 100,
    startDate: '',
    endDate: '',
    badgeReward: ''
  });

  // Fetch challenges
  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/challenges`],
    enabled: !!currentClassroom?.id
  });

  // Fetch available badges for rewards
  const { data: badges = [] } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/badges`],
    enabled: !!currentClassroom?.id
  });

  // Fetch challenge analytics
  const { data: analytics = {} } = useQuery({
    queryKey: [`/api/classrooms/${currentClassroom?.id}/challenge-analytics`],
    enabled: !!currentClassroom?.id
  });

  // Create challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/classrooms/${currentClassroom!.id}/challenges`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/challenges`] });
      setIsCreateDialogOpen(false);
      resetForm();
    }
  });

  // Toggle challenge status
  const toggleChallengeMutation = useMutation({
    mutationFn: async ({ challengeId, isActive }: { challengeId: string; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/challenges/${challengeId}/toggle`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${currentClassroom?.id}/challenges`] });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'individual',
      targetMetric: 'assignments_completed',
      targetValue: 10,
      tokenReward: 100,
      startDate: '',
      endDate: '',
      badgeReward: ''
    });
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (template: ChallengeTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.name,
      description: template.description,
      type: template.type,
      targetMetric: template.targetMetric,
      targetValue: template.targetValue,
      tokenReward: template.tokenReward,
      startDate: '',
      endDate: '',
      badgeReward: template.badgeReward || ''
    });
  };

  const handleCreateChallenge = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }
    createChallengeMutation.mutate(formData);
  };

  const filteredTemplates = ENHANCED_CHALLENGE_TEMPLATES.filter(template => {
    const categoryMatch = selectedCategory === "all" || template.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === "all" || template.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const activeChallenges = (challenges as ClassroomChallenge[]).filter((c: ClassroomChallenge) => c.isActive);
  const completedChallenges = (challenges as ClassroomChallenge[]).filter((c: ClassroomChallenge) => !c.isActive);

  if (!currentClassroom) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            Please select a classroom to manage challenges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Enhanced Challenge System
          </h1>
          <p className="text-muted-foreground mt-1">
            Create engaging challenges to motivate and track student progress
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Active Challenges</p>
                <p className="text-2xl font-bold">{activeChallenges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{completedChallenges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Participants</p>
                <p className="text-2xl font-bold">{(analytics as any)?.totalParticipants || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <p className="text-2xl font-bold">{(analytics as any)?.completionRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Challenges</TabsTrigger>
          <TabsTrigger value="templates">Challenge Templates</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                Active Challenges
              </CardTitle>
              <CardDescription>
                Currently running challenges in your classroom
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active challenges</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first challenge to start engaging your students
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Challenge
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeChallenges.map((challenge: ClassroomChallenge, index: number) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="text-2xl">{typeIcons[challenge.type]}</div>
                              <div>
                                <h3 className="font-semibold text-sm">{challenge.title}</h3>
                                <Badge variant="outline" className="text-xs capitalize mt-1">
                                  {challenge.type}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleChallengeMutation.mutate({
                                challengeId: challenge.id,
                                isActive: false
                              })}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {challenge.description}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{challenge.progress?.current || 0}/{challenge.targetValue}</span>
                            </div>
                            <Progress 
                              value={((challenge.progress?.current || 0) / challenge.targetValue) * 100} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              <span>{challenge.tokenReward} tokens</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>Ends {format(new Date(challenge.endDate), 'MMM dd')}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Category:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="academic">📚 Academic</SelectItem>
                  <SelectItem value="collaboration">🤝 Collaboration</SelectItem>
                  <SelectItem value="participation">💬 Participation</SelectItem>
                  <SelectItem value="creativity">🎨 Creativity</SelectItem>
                  <SelectItem value="behavior">😊 Behavior</SelectItem>
                  <SelectItem value="attendance">📅 Attendance</SelectItem>
                  <SelectItem value="technical">💻 Technical</SelectItem>
                  <SelectItem value="milestone">🎯 Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Difficulty:</Label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-purple-500" />
                Challenge Templates
              </CardTitle>
              <CardDescription>
                Choose from pre-designed challenges or create your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="text-xl">{typeIcons[template.type]}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", difficultyColors[template.difficulty])}
                              >
                                {template.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3 flex-1 line-clamp-3">
                          {template.description}
                        </p>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-xs">
                            <span>Target: {template.targetValue}</span>
                            <span>{template.duration}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            <span>{template.tokenReward} tokens</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", `bg-gradient-to-r ${categoryColors[template.category as keyof typeof categoryColors]} bg-clip-text text-transparent`)}
                          >
                            {template.category}
                          </Badge>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full mt-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed Challenges
              </CardTitle>
              <CardDescription>
                Previously completed challenges and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedChallenges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No completed challenges yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedChallenges.map((challenge: ClassroomChallenge) => (
                    <Card key={challenge.id} className="opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <h3 className="font-semibold text-sm">{challenge.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{challenge.description}</p>
                        <div className="text-xs text-muted-foreground">
                          Completed: {format(new Date(challenge.endDate), 'MMM dd, yyyy')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Individual Challenges</span>
                    <span className="text-sm font-medium">{(analytics as any)?.individualCompletion || 0}%</span>
                  </div>
                  <Progress value={(analytics as any)?.individualCompletion || 0} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Team Challenges</span>
                    <span className="text-sm font-medium">{(analytics as any)?.teamCompletion || 0}%</span>
                  </div>
                  <Progress value={(analytics as any)?.teamCompletion || 0} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Classroom Challenges</span>
                    <span className="text-sm font-medium">{(analytics as any)?.classroomCompletion || 0}%</span>
                  </div>
                  <Progress value={(analytics as any)?.classroomCompletion || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(categoryColors).map(([category, gradient]) => {
                    const count = (challenges as ClassroomChallenge[]).filter((c: ClassroomChallenge) => 
                      ENHANCED_CHALLENGE_TEMPLATES.find(t => t.name === c.title)?.category === category
                    ).length;
                    const percentage = (challenges as ClassroomChallenge[]).length > 0 ? (count / (challenges as ClassroomChallenge[]).length) * 100 : 0;
                    
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{category}</span>
                          <span>{count} challenges ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Challenge Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Create New Challenge
              {selectedTemplate && (
                <Badge variant="outline" className="ml-2">
                  From Template: {selectedTemplate.name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Challenge Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter challenge title"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Challenge Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">👤 Individual</SelectItem>
                    <SelectItem value="team">👥 Team</SelectItem>
                    <SelectItem value="classroom">🏫 Classroom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students need to accomplish"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="targetMetric">Target Metric</Label>
                <Select value={formData.targetMetric} onValueChange={(value) => setFormData({ ...formData, targetMetric: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignments_completed">Assignments Completed</SelectItem>
                    <SelectItem value="quiz_scores">Quiz Scores</SelectItem>
                    <SelectItem value="participation_points">Participation Points</SelectItem>
                    <SelectItem value="study_hours">Study Hours</SelectItem>
                    <SelectItem value="group_projects">Group Projects</SelectItem>
                    <SelectItem value="attendance_days">Attendance Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="1"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 1 })}
                />
              </div>
              
              <div>
                <Label htmlFor="tokenReward">Token Reward</Label>
                <Input
                  id="tokenReward"
                  type="number"
                  min="0"
                  value={formData.tokenReward}
                  onChange={(e) => setFormData({ ...formData, tokenReward: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="badgeReward">Badge Reward (Optional)</Label>
              <Select value={formData.badgeReward} onValueChange={(value) => setFormData({ ...formData, badgeReward: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a badge reward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No badge reward</SelectItem>
                  {(badges as any[]).map((badge: any) => (
                    <SelectItem key={badge.id} value={badge.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded flex items-center justify-center text-xs"
                          style={{ backgroundColor: badge.color, color: 'white' }}
                        >
                          <i className={badge.icon}></i>
                        </div>
                        {badge.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="mt-2 p-3 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-lg">{typeIcons[formData.type]}</div>
                    <h4 className="font-semibold text-sm">{formData.title || 'Challenge Title'}</h4>
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {formData.description || 'Challenge description will appear here'}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>0/{formData.targetValue}</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <span>{formData.tokenReward} tokens</span>
                  </div>
                  {formData.endDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>Ends {format(new Date(formData.endDate), 'MMM dd')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateChallenge}
                disabled={createChallengeMutation.isPending || !formData.title || !formData.description}
                className="flex-1"
              >
                {createChallengeMutation.isPending ? "Creating..." : "Create Challenge"}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}