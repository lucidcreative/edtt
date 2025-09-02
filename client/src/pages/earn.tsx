import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import StudentEarn from "@/components/student/student-earn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  Clock, 
  BarChart3, 
  Users, 
  Plus, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Target,
  Award,
  Timer,
  BookOpen,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Link as LinkIcon,
  Coins
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AssignmentResourceManager } from "@/components/assignment/assignment-resource-manager";

export default function Earn() {
  const { user } = useAuth();
  
  // Show student earn view for students
  if (user?.role === 'student') {
    return <StudentEarn />;
  }
  
  // Teacher Earn Management (formerly Teacher Management)
  const { currentClassroom } = useClassroom();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState("assignments");
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState("7");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    category: '',
    dueDate: '',
    tokenReward: 10,
    link: ''
  });

  // Only allow teachers to access this page
  if (user?.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

  // Data queries
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/assignments/classroom", currentClassroom?.id],
    enabled: !!currentClassroom
  }) as { data: any[], isLoading: boolean };

  const { data: submissions = [] } = useQuery({
    queryKey: ["/api/submissions/classroom", currentClassroom?.id],
    enabled: !!currentClassroom
  }) as { data: any[] };

  const { data: students = [] } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "students"],
    enabled: !!currentClassroom
  }) as { data: any[] };

  const { data: timeTracking = [] } = useQuery({
    queryKey: ["/api/time-tracking/classroom", currentClassroom?.id, "range", selectedDateRange],
    enabled: !!currentClassroom
  }) as { data: any[] };

  const { data: classroomStats } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "stats"],
    enabled: !!currentClassroom
  }) as { data: any };

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      return apiRequest("POST", "/api/assignments", {
        ...assignmentData,
        classroomId: currentClassroom?.id,
        teacherId: user?.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment Created!",
        description: "Your assignment has been successfully created.",
      });
      setIsCreateAssignmentOpen(false);
      setAssignmentForm({
        title: '',
        description: '',
        category: '',
        dueDate: '',
        tokenReward: 10,
        link: ''
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/classroom", currentClassroom?.id] });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Calculate analytics data
  const getAnalyticsData = () => {
    const totalAssignments = assignments.length;
    const completedSubmissions = submissions.filter(s => s.status === 'approved').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
    const completionRate = totalAssignments > 0 ? Math.round((completedSubmissions / (totalAssignments * students.length)) * 100) : 0;
    
    // Calculate average time per student
    const studentTimeData = students.map(student => {
      const studentTime = timeTracking.filter(t => t.studentId === student.id);
      const totalMinutes = studentTime.reduce((sum, t) => sum + (t.duration || 0), 0);
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      return {
        studentName: student.name || student.nickname,
        totalHours,
        sessionCount: studentTime.length
      };
    });

    // Assignment completion by category
    const categoryData = assignments.reduce((acc, assignment) => {
      if (!acc[assignment.category]) {
        acc[assignment.category] = { total: 0, completed: 0 };
      }
      acc[assignment.category].total++;
      const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id && s.status === 'approved');
      acc[assignment.category].completed += assignmentSubmissions.length;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return {
      totalAssignments,
      completedSubmissions,
      pendingSubmissions,
      completionRate,
      studentTimeData,
      categoryData,
      averageTimePerAssignment: totalAssignments > 0 ? Math.round((timeTracking.reduce((sum, t) => sum + (t.duration || 0), 0) / 60) / totalAssignments * 10) / 10 : 0
    };
  };

  const analyticsData = getAnalyticsData();

  const handleCreateAssignment = () => {
    if (!assignmentForm.title.trim() || !assignmentForm.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    createAssignmentMutation.mutate(assignmentForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Earn Management</h1>
              <p className="text-muted-foreground">Manage assignments and track classroom earning opportunities</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="hidden lg:flex gap-4">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-xl font-bold">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assignments</p>
                    <p className="text-xl font-bold">{analyticsData.totalAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-xl font-bold">{analyticsData.completionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="time-tracking" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Tracking
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Assignment Management Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Assignment Management</h2>
                <p className="text-sm text-muted-foreground">Create, edit, and track assignments for your classroom</p>
              </div>
              <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      Create New Assignment
                    </DialogTitle>
                    <DialogDescription>
                      Create a new assignment for your students to complete and earn tokens.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <Input
                        value={assignmentForm.title}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter assignment title"
                        data-testid="input-assignment-title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        value={assignmentForm.description}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter assignment description"
                        rows={3}
                        data-testid="textarea-assignment-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Category *</label>
                        <Select value={assignmentForm.category} onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger data-testid="select-assignment-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Homework">Homework</SelectItem>
                            <SelectItem value="Project">Project</SelectItem>
                            <SelectItem value="Quiz">Quiz</SelectItem>
                            <SelectItem value="Essay">Essay</SelectItem>
                            <SelectItem value="Research">Research</SelectItem>
                            <SelectItem value="Presentation">Presentation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <Input
                          type="date"
                          value={assignmentForm.dueDate}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          data-testid="input-assignment-due-date"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Token Reward</label>
                      <Input
                        type="number"
                        value={assignmentForm.tokenReward}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, tokenReward: parseInt(e.target.value) || 0 }))}
                        placeholder="10"
                        min={0}
                        data-testid="input-assignment-tokens"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Link (Optional)</label>
                      <Input
                        type="url"
                        value={assignmentForm.link}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, link: e.target.value }))}
                        placeholder="https://example.com/resource"
                        data-testid="input-assignment-link"
                      />
                      <p className="text-xs text-gray-500 mt-1">Add a URL for additional resources or instructions</p>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateAssignment} disabled={createAssignmentMutation.isPending} className="flex-1" data-testid="button-create-assignment">
                        {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreateAssignmentOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Assignment List */}
            {assignmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              </div>
            ) : assignments.length === 0 ? (
              <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Create your first assignment to get started.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment: any, index: number) => {
                  const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
                  const approvedCount = assignmentSubmissions.filter(s => s.status === 'approved').length;
                  const pendingCount = assignmentSubmissions.filter(s => s.status === 'pending').length;
                  const completionRate = students.length > 0 ? Math.round((approvedCount / students.length) * 100) : 0;
                  
                  return (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
                      data-testid={`assignment-card-${index}`}
                    >
                      <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{assignment.title}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{assignment.category}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="p-2" 
                                onClick={() => setExpandedAssignment(expandedAssignment === assignment.id ? null : assignment.id)}
                                data-testid={`button-manage-resources-${index}`}
                              >
                                <LinkIcon className="w-4 h-4 text-yellow-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="p-2" data-testid={`button-view-assignment-${index}`}>
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="p-2" data-testid={`button-edit-assignment-${index}`}>
                                <Edit className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="p-2" data-testid={`button-delete-assignment-${index}`}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{assignment.description}</p>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Completion Rate</span>
                              <span className="font-medium">{completionRate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${completionRate}%` }}
                              ></div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span>{approvedCount}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-orange-600" />
                                  <span>{pendingCount}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Award className="w-4 h-4 text-yellow-600" />
                                <span>{assignment.tokenReward} tokens</span>
                              </div>
                            </div>
                            
                            {assignment.dueDate && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </CardContent>
                        
                        {/* Assignment Resource Manager - Expandable Section */}
                        {expandedAssignment === assignment.id && (
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50 p-6">
                            <AssignmentResourceManager 
                              assignmentId={assignment.id} 
                              classroomId={currentClassroom?.id || ''} 
                            />
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Time Tracking Tab */}
          <TabsContent value="time-tracking" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Time Tracking Dashboard</h2>
                <p className="text-sm text-muted-foreground">Monitor student time and earning progress</p>
              </div>
              <div className="flex gap-2">
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Time Tracking Controls */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Time Tracking Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Tokens per Hour</Label>
                    <Input
                      type="number"
                      value={currentClassroom?.tokensPerHour || 5}
                      onChange={(e) => {
                        // TODO: Update classroom settings
                      }}
                      min={1}
                      max={50}
                    />
                  </div>
                  <div>
                    <Label>Max Daily Hours per Student</Label>
                    <Input
                      type="number"
                      value={currentClassroom?.maxDailyHours || 8}
                      onChange={(e) => {
                        // TODO: Update classroom settings
                      }}
                      min={1}
                      max={12}
                      step={0.5}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentClassroom?.timeTrackingEnabled || false}
                        onChange={(e) => {
                          // TODO: Update classroom settings
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">Enable Time Tracking</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Save Settings
                  </Button>
                  <Button variant="outline" size="sm">
                    Pause All Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Time Tracking Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Timer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Time</p>
                      <p className="text-2xl font-bold">
                        {Math.round(timeTracking.reduce((sum, t) => sum + (t.duration || 0), 0) / 60 * 10) / 10}h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                      <p className="text-2xl font-bold">{new Set(timeTracking.map(t => t.studentId)).size}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Session</p>
                      <p className="text-2xl font-bold">
                        {timeTracking.length > 0 ? 
                          Math.round(timeTracking.reduce((sum, t) => sum + (t.duration || 0), 0) / timeTracking.length) : 0}m
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tokens Earned</p>
                      <p className="text-2xl font-bold">{timeTracking.reduce((sum, t) => sum + (t.tokensEarned || 0), 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Tracking Table */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle>Time Tracking Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {timeTracking.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No time tracking data available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Student</th>
                          <th className="text-left p-2">Clock In</th>
                          <th className="text-left p-2">Clock Out</th>
                          <th className="text-left p-2">Duration</th>
                          <th className="text-left p-2">Tokens</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeTracking.slice(0, 15).map((entry: any, index: number) => {
                          const student = students.find(s => s.id === entry.studentId);
                          const clockInTime = new Date(entry.clockInTime);
                          const clockOutTime = entry.clockOutTime ? new Date(entry.clockOutTime) : null;
                          return (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-medium">{student?.name || student?.nickname || 'Unknown'}</td>
                              <td className="p-2 text-sm">
                                <div>{clockInTime.toLocaleDateString()}</div>
                                <div className="text-gray-500">{clockInTime.toLocaleTimeString()}</div>
                              </td>
                              <td className="p-2 text-sm">
                                {clockOutTime ? (
                                  <div>
                                    <div>{clockOutTime.toLocaleDateString()}</div>
                                    <div className="text-gray-500">{clockOutTime.toLocaleTimeString()}</div>
                                  </div>
                                ) : (
                                  <span className="text-blue-600">Active</span>
                                )}
                              </td>
                              <td className="p-2">{Math.round((entry.duration || 0) / 60 * 10) / 10}h</td>
                              <td className="p-2 font-medium">{entry.tokensEarned || 0}</td>
                              <td className="p-2">
                                <Badge variant={entry.status === 'completed' ? 'default' : entry.status === 'active' ? 'secondary' : 'outline'}>
                                  {entry.status}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" title="Adjust Time">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  {entry.status === 'active' && (
                                    <Button size="sm" variant="outline" title="Force Clock Out">
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Earning Analytics</h2>
              <p className="text-sm text-muted-foreground">Track student progress and earning opportunities</p>
            </div>

            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{analyticsData.completedSubmissions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{analyticsData.pendingSubmissions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">{analyticsData.completionRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Timer className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Time/Assignment</p>
                      <p className="text-2xl font-bold">{analyticsData.averageTimePerAssignment}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Time Breakdown */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle>Student Time Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.studentTimeData.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No time data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyticsData.studentTimeData.map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">{student.sessionCount} sessions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{student.totalHours}h</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle>Assignment Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(analyticsData.categoryData).length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No category data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(analyticsData.categoryData).map(([category, data], index) => {
                      const percentage = (data as any).total > 0 ? Math.round(((data as any).completed / (data as any).total) * 100) : 0;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{category}</span>
                            <span>{(data as any).completed}/{(data as any).total} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}