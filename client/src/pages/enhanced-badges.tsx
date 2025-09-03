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
  Award, 
  Trophy, 
  Star, 
  Plus, 
  Users, 
  TrendingUp, 
  Calendar,
  Target,
  Gift,
  Medal,
  Crown,
  Heart,
  Lightbulb,
  BookOpen,
  Clock,
  CheckCircle,
  Sparkles,
  Zap,
  PlusCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  criteria?: {
    type: 'manual' | 'automatic';
    conditions?: any;
  };
}

interface ClassroomBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  criteria: any;
  isActive: boolean;
  createdAt: string;
}

interface Student {
  id: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const ENHANCED_BADGE_TEMPLATES: BadgeTemplate[] = [
  // Academic Excellence
  { 
    id: 'perfect-score', 
    name: 'Perfect Score', 
    description: 'Achieved 100% on an assignment', 
    icon: 'fas fa-star', 
    color: '#f59e0b', 
    category: 'academic',
    criteria: { type: 'automatic', conditions: { assignment_score: 100 } }
  },
  { 
    id: 'honor-student', 
    name: 'Honor Student', 
    description: 'Maintained A average for the semester', 
    icon: 'fas fa-graduation-cap', 
    color: '#10b981', 
    category: 'academic' 
  },
  { 
    id: 'quick-learner', 
    name: 'Quick Learner', 
    description: 'Completed assignment ahead of deadline', 
    icon: 'fas fa-lightning-bolt', 
    color: '#3b82f6', 
    category: 'academic' 
  },
  { 
    id: 'research-master', 
    name: 'Research Master', 
    description: 'Exceptional research and presentation skills', 
    icon: 'fas fa-search', 
    color: '#8b5cf6', 
    category: 'academic' 
  },
  { 
    id: 'critical-thinker', 
    name: 'Critical Thinker', 
    description: 'Demonstrated excellent analytical skills', 
    icon: 'fas fa-brain', 
    color: '#06b6d4', 
    category: 'academic' 
  },

  // Character & Behavior
  { 
    id: 'kindness-champion', 
    name: 'Kindness Champion', 
    description: 'Showed exceptional kindness and empathy', 
    icon: 'fas fa-heart', 
    color: '#ef4444', 
    category: 'character' 
  },
  { 
    id: 'integrity-award', 
    name: 'Integrity Award', 
    description: 'Demonstrated honesty and moral principles', 
    icon: 'fas fa-shield-alt', 
    color: '#10b981', 
    category: 'character' 
  },
  { 
    id: 'respect-ambassador', 
    name: 'Respect Ambassador', 
    description: 'Shows respect to everyone in the classroom', 
    icon: 'fas fa-handshake', 
    color: '#3b82f6', 
    category: 'character' 
  },
  { 
    id: 'perseverance-medal', 
    name: 'Perseverance Medal', 
    description: 'Never gave up despite challenges', 
    icon: 'fas fa-mountain', 
    color: '#f97316', 
    category: 'character' 
  },

  // Leadership & Participation
  { 
    id: 'class-leader', 
    name: 'Class Leader', 
    description: 'Demonstrated natural leadership abilities', 
    icon: 'fas fa-crown', 
    color: '#f59e0b', 
    category: 'leadership' 
  },
  { 
    id: 'discussion-star', 
    name: 'Discussion Star', 
    description: 'Actively participates in class discussions', 
    icon: 'fas fa-comments', 
    color: '#06b6d4', 
    category: 'participation' 
  },
  { 
    id: 'mentor-badge', 
    name: 'Peer Mentor', 
    description: 'Helps other students learn and grow', 
    icon: 'fas fa-user-friends', 
    color: '#10b981', 
    category: 'leadership' 
  },
  { 
    id: 'question-master', 
    name: 'Question Master', 
    description: 'Asks thoughtful and insightful questions', 
    icon: 'fas fa-question-circle', 
    color: '#8b5cf6', 
    category: 'participation' 
  },

  // Creativity & Innovation
  { 
    id: 'creative-genius', 
    name: 'Creative Genius', 
    description: 'Exceptional creativity in projects', 
    icon: 'fas fa-palette', 
    color: '#f97316', 
    category: 'creativity' 
  },
  { 
    id: 'innovation-award', 
    name: 'Innovation Award', 
    description: 'Came up with innovative solutions', 
    icon: 'fas fa-lightbulb', 
    color: '#f59e0b', 
    category: 'creativity' 
  },
  { 
    id: 'artistic-excellence', 
    name: 'Artistic Excellence', 
    description: 'Outstanding work in visual arts', 
    icon: 'fas fa-paint-brush', 
    color: '#ef4444', 
    category: 'creativity' 
  },

  // Collaboration & Teamwork
  { 
    id: 'team-captain', 
    name: 'Team Captain', 
    description: 'Exceptional leadership in group projects', 
    icon: 'fas fa-users', 
    color: '#10b981', 
    category: 'teamwork' 
  },
  { 
    id: 'collaboration-pro', 
    name: 'Collaboration Pro', 
    description: 'Works seamlessly with any team', 
    icon: 'fas fa-handshake', 
    color: '#3b82f6', 
    category: 'teamwork' 
  },
  { 
    id: 'conflict-resolver', 
    name: 'Conflict Resolver', 
    description: 'Helps resolve disputes peacefully', 
    icon: 'fas fa-balance-scale', 
    color: '#8b5cf6', 
    category: 'teamwork' 
  },

  // Special Achievements
  { 
    id: 'perfect-attendance', 
    name: 'Perfect Attendance', 
    description: 'Never missed a single class', 
    icon: 'fas fa-calendar-check', 
    color: '#10b981', 
    category: 'attendance' 
  },
  { 
    id: 'early-bird', 
    name: 'Early Bird', 
    description: 'Always arrives on time or early', 
    icon: 'fas fa-clock', 
    color: '#f59e0b', 
    category: 'attendance' 
  },
  { 
    id: 'technology-wizard', 
    name: 'Technology Wizard', 
    description: 'Exceptional skills with technology', 
    icon: 'fas fa-laptop-code', 
    color: '#06b6d4', 
    category: 'technical' 
  },
  { 
    id: 'reading-champion', 
    name: 'Reading Champion', 
    description: 'Completed advanced reading goals', 
    icon: 'fas fa-book-open', 
    color: '#8b5cf6', 
    category: 'academic' 
  },

  // Milestone Badges
  { 
    id: 'first-week', 
    name: 'Welcome Aboard', 
    description: 'Successfully completed first week', 
    icon: 'fas fa-flag', 
    color: '#84cc16', 
    category: 'milestone' 
  },
  { 
    id: 'month-achiever', 
    name: 'Month Achiever', 
    description: 'Consistent performance for a month', 
    icon: 'fas fa-calendar-alt', 
    color: '#f97316', 
    category: 'milestone' 
  },
  { 
    id: 'semester-star', 
    name: 'Semester Star', 
    description: 'Outstanding performance all semester', 
    icon: 'fas fa-trophy', 
    color: '#f59e0b', 
    category: 'milestone' 
  }
];

const categoryColors = {
  academic: 'from-blue-500 to-cyan-500',
  character: 'from-green-500 to-emerald-500',
  leadership: 'from-purple-500 to-violet-500',
  participation: 'from-orange-500 to-red-500',
  creativity: 'from-pink-500 to-rose-500',
  teamwork: 'from-indigo-500 to-blue-500',
  attendance: 'from-emerald-500 to-teal-500',
  technical: 'from-cyan-500 to-blue-500',
  milestone: 'from-yellow-500 to-orange-500'
};

const iconOptions = [
  { value: 'fas fa-trophy', label: '🏆 Trophy' },
  { value: 'fas fa-star', label: '⭐ Star' },
  { value: 'fas fa-medal', label: '🏅 Medal' },
  { value: 'fas fa-award', label: '🎖️ Award' },
  { value: 'fas fa-crown', label: '👑 Crown' },
  { value: 'fas fa-gem', label: '💎 Gem' },
  { value: 'fas fa-heart', label: '❤️ Heart' },
  { value: 'fas fa-lightbulb', label: '💡 Lightbulb' },
  { value: 'fas fa-rocket', label: '🚀 Rocket' },
  { value: 'fas fa-graduation-cap', label: '🎓 Graduation Cap' },
  { value: 'fas fa-book-open', label: '📖 Open Book' },
  { value: 'fas fa-brain', label: '🧠 Brain' },
  { value: 'fas fa-handshake', label: '🤝 Handshake' },
  { value: 'fas fa-users', label: '👥 Users' },
  { value: 'fas fa-palette', label: '🎨 Palette' },
  { value: 'fas fa-clock', label: '🕐 Clock' },
  { value: 'fas fa-calendar-check', label: '📅 Calendar Check' }
];

const colorOptions = [
  { value: '#f59e0b', label: 'Gold', bg: 'bg-yellow-500' },
  { value: '#10b981', label: 'Green', bg: 'bg-green-500' },
  { value: '#3b82f6', label: 'Blue', bg: 'bg-blue-500' },
  { value: '#ef4444', label: 'Red', bg: 'bg-red-500' },
  { value: '#8b5cf6', label: 'Purple', bg: 'bg-purple-500' },
  { value: '#06b6d4', label: 'Cyan', bg: 'bg-cyan-500' },
  { value: '#84cc16', label: 'Lime', bg: 'bg-lime-500' },
  { value: '#f97316', label: 'Orange', bg: 'bg-orange-500' }
];

export default function EnhancedBadges() {
  const { user } = useAuth();
  const { selectedClassroom } = useClassroom();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("manage");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [selectedBadgeForAward, setSelectedBadgeForAward] = useState<ClassroomBadge | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'fas fa-star',
    color: '#f59e0b',
    category: 'academic'
  });

  // Fetch classroom badges
  const { data: badgesData, isLoading: badgesLoading } = useQuery({
    queryKey: [`/api/classrooms/${selectedClassroom?.id}/badges`],
    enabled: !!selectedClassroom?.id
  });

  const badges: ClassroomBadge[] = Array.isArray(badgesData) ? badgesData : [];

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: [`/api/classrooms/${selectedClassroom?.id}/students`],
    enabled: !!selectedClassroom?.id
  });

  const students: Student[] = Array.isArray(studentsData) ? studentsData : [];

  // Fetch badge analytics
  const { data: analyticsData } = useQuery({
    queryKey: [`/api/classrooms/${selectedClassroom?.id}/badge-analytics`],
    enabled: !!selectedClassroom?.id
  });

  const analytics = analyticsData || { totalAwarded: 0, thisWeek: 0 };

  // Create badge mutation
  const createBadgeMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/classrooms/${selectedClassroom!.id}/badges`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${selectedClassroom?.id}/badges`] });
      setIsCreateDialogOpen(false);
      resetForm();
    }
  });

  // Award badge mutation
  const awardBadgeMutation = useMutation({
    mutationFn: ({ badgeId, studentIds }: { badgeId: string; studentIds: string[] }) =>
      apiRequest(`/api/badges/${badgeId}/award`, 'POST', { studentIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${selectedClassroom?.id}/badge-analytics`] });
      setIsAwardDialogOpen(false);
      setSelectedStudents([]);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'fas fa-star',
      color: '#f59e0b',
      category: 'academic'
    });
  };

  const handleTemplateSelect = (template: BadgeTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      category: template.category
    });
  };

  const handleCreateBadge = () => {
    createBadgeMutation.mutate(formData);
  };

  const handleAwardBadge = () => {
    if (selectedBadgeForAward && selectedStudents.length > 0) {
      awardBadgeMutation.mutate({
        badgeId: selectedBadgeForAward.id,
        studentIds: selectedStudents
      });
    }
  };

  const filteredTemplates = selectedCategory === "all" 
    ? ENHANCED_BADGE_TEMPLATES 
    : ENHANCED_BADGE_TEMPLATES.filter(t => t.category === selectedCategory);

  const filteredBadges = selectedCategory === "all"
    ? badges
    : badges.filter((b: ClassroomBadge) => b.category === selectedCategory);

  const getStudentName = (student: Student) => {
    return student.nickname || `${student.firstName} ${student.lastName}`.trim() || 'Unknown Student';
  };

  if (!selectedClassroom) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <Award className="h-4 w-4" />
          <AlertDescription>
            Please select a classroom to manage badges.
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Enhanced Badge System
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and award badges to recognize student achievements
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Badge
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage">Manage Badges</TabsTrigger>
          <TabsTrigger value="templates">Badge Templates</TabsTrigger>
          <TabsTrigger value="award">Award Badges</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium">Filter by Category:</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="academic">📚 Academic</SelectItem>
              <SelectItem value="character">💫 Character</SelectItem>
              <SelectItem value="leadership">👑 Leadership</SelectItem>
              <SelectItem value="participation">💬 Participation</SelectItem>
              <SelectItem value="creativity">🎨 Creativity</SelectItem>
              <SelectItem value="teamwork">🤝 Teamwork</SelectItem>
              <SelectItem value="attendance">📅 Attendance</SelectItem>
              <SelectItem value="technical">💻 Technical</SelectItem>
              <SelectItem value="milestone">🎯 Milestone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Your Classroom Badges
              </CardTitle>
              <CardDescription>
                Badges you've created for your classroom
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBadges.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
                  <p className="text-gray-500 mb-4">
                    {selectedCategory === "all" 
                      ? "Create your first badge to start recognizing student achievements"
                      : `No badges in the ${selectedCategory} category yet`}
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Badge
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredBadges.map((badge: ClassroomBadge, index: number) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-4 text-center">
                          <div 
                            className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center text-white text-2xl"
                            style={{ backgroundColor: badge.color }}
                          >
                            <i className={badge.icon}></i>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {badge.description}
                          </p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {badge.category}
                          </Badge>
                          
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBadgeForAward(badge);
                                setIsAwardDialogOpen(true);
                              }}
                              className="w-full"
                            >
                              Award Badge
                            </Button>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Badge Templates
              </CardTitle>
              <CardDescription>
                Choose from pre-designed badges or create your own
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
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-4 text-center">
                        <div 
                          className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center text-white text-2xl"
                          style={{ backgroundColor: template.color }}
                        >
                          <i className={template.icon}></i>
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs capitalize mb-3", `bg-gradient-to-r ${categoryColors[template.category as keyof typeof categoryColors]} bg-clip-text text-transparent`)}
                        >
                          {template.category}
                        </Badge>
                        
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            onClick={() => handleTemplateSelect(template)}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="award" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-500" />
                Award Badges to Students
              </CardTitle>
              <CardDescription>
                Recognize student achievements by awarding badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No badges available</h3>
                  <p className="text-gray-500 mb-4">
                    Create some badges first before you can award them to students
                  </p>
                  <Button onClick={() => setActiveTab("manage")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Badges
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBadges.map((badge: ClassroomBadge) => (
                    <Card key={badge.id} className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                            style={{ backgroundColor: badge.color }}
                          >
                            <i className={badge.icon}></i>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{badge.name}</h3>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedBadgeForAward(badge);
                            setIsAwardDialogOpen(true);
                          }}
                          className="w-full"
                        >
                          Award to Students
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Total Badges</p>
                    <p className="text-2xl font-bold">{badges.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Students</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Awarded</p>
                    <div className="text-2xl font-bold">{(analytics as any)?.totalAwarded || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">This Week</p>
                    <div className="text-2xl font-bold">{(analytics as any)?.thisWeek || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Badge Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryColors).map(([category, gradient]) => {
                  const count = badges.filter((b: ClassroomBadge) => b.category === category).length;
                  const percentage = badges.length > 0 ? (count / badges.length) * 100 : 0;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{category}</span>
                        <span>{count} badges ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Badge Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Create Custom Badge
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Badge Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter badge name"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">📚 Academic</SelectItem>
                    <SelectItem value="character">💫 Character</SelectItem>
                    <SelectItem value="leadership">👑 Leadership</SelectItem>
                    <SelectItem value="participation">💬 Participation</SelectItem>
                    <SelectItem value="creativity">🎨 Creativity</SelectItem>
                    <SelectItem value="teamwork">🤝 Teamwork</SelectItem>
                    <SelectItem value="attendance">📅 Attendance</SelectItem>
                    <SelectItem value="technical">💻 Technical</SelectItem>
                    <SelectItem value="milestone">🎯 Milestone</SelectItem>
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
                placeholder="Describe what this badge recognizes"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-4 h-4 rounded", option.bg)}></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="flex items-center gap-3 mt-2">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: formData.color }}
                >
                  <i className={formData.icon}></i>
                </div>
                <div>
                  <p className="font-semibold text-sm">{formData.name || 'Badge Name'}</p>
                  <p className="text-xs text-muted-foreground">{formData.description || 'Badge description'}</p>
                  <Badge variant="outline" className="text-xs capitalize mt-1">
                    {formData.category}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateBadge}
                disabled={createBadgeMutation.isPending || !formData.name}
                className="flex-1"
              >
                {createBadgeMutation.isPending ? "Creating..." : "Create Badge"}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award Badge Dialog */}
      <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Award Badge: {selectedBadgeForAward?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-3">
                {selectedBadgeForAward && (
                  <>
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: selectedBadgeForAward.color }}
                    >
                      <i className={selectedBadgeForAward.icon}></i>
                    </div>
                    <div>
                      <p className="font-semibold">{selectedBadgeForAward.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedBadgeForAward.description}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Select Students:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-64 overflow-y-auto">
                {students.map((student: Student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={student.id}
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={student.id} className="text-sm">
                      {getStudentName(student)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleAwardBadge}
                disabled={awardBadgeMutation.isPending || selectedStudents.length === 0}
                className="flex-1"
              >
                {awardBadgeMutation.isPending ? "Awarding..." : `Award to ${selectedStudents.length} Student(s)`}
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