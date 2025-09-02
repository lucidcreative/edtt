import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MoreHorizontal,
  Filter,
  Bell,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  ArrowRight,
  Star,
  Target,
  Lightbulb,
  Award,
  Plus,
  DollarSign,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Proposal {
  id: string;
  title: string;
  content: string;
  scopeOfWork?: string;
  status: 'draft' | 'submitted' | 'pending' | 'under_review' | 'needs_revision' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progressPercentage: number;
  milestones?: string[];
  completedMilestones?: string[];
  teacherFeedback?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    nickname?: string;
    firstName?: string;
    lastName?: string;
  };
  assignment: {
    id: string;
    title: string;
  };
}

interface ProposalFeedback {
  id: string;
  feedbackType: string;
  feedbackContent: string;
  createdAt: string;
  fromUser: {
    id: string;
    firstName?: string;
    lastName?: string;
    nickname?: string;
  };
}

interface ProposalNotification {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

const statusConfig = {
  draft: { color: "bg-gray-500", label: "Draft", icon: FileText },
  submitted: { color: "bg-blue-500", label: "Submitted", icon: Clock },
  pending: { color: "bg-yellow-500", label: "Pending Review", icon: Clock },
  under_review: { color: "bg-purple-500", label: "Under Review", icon: Eye },
  needs_revision: { color: "bg-orange-500", label: "Needs Revision", icon: AlertCircle },
  approved: { color: "bg-green-500", label: "Approved", icon: CheckCircle },
  rejected: { color: "bg-red-500", label: "Rejected", icon: XCircle },
  in_progress: { color: "bg-indigo-500", label: "In Progress", icon: TrendingUp },
  completed: { color: "bg-emerald-500", label: "Completed", icon: Award }
};

const priorityConfig = {
  low: { color: "bg-slate-400", label: "Low" },
  medium: { color: "bg-blue-500", label: "Medium" },
  high: { color: "bg-orange-500", label: "High" },
  urgent: { color: "bg-red-500", label: "Urgent" }
};

export default function ProposalsPortal() {
  const { user } = useAuth();
  const { selectedClassroom } = useClassroom();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<string>("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [showCreateRFPDialog, setShowCreateRFPDialog] = useState(false);
  const [rfpTitle, setRfpTitle] = useState("");
  const [rfpDescription, setRfpDescription] = useState("");
  const [rfpRequirements, setRfpRequirements] = useState("");
  const [rfpBudget, setRfpBudget] = useState("");
  const [rfpDeadline, setRfpDeadline] = useState("");
  const [rfpVisibility, setRfpVisibility] = useState<"public" | "private">("public");
  const [rfpTokenReward, setRfpTokenReward] = useState("");
  const [proposalGrade, setProposalGrade] = useState("");
  const [proposalTokens, setProposalTokens] = useState("");
  const queryClient = useQueryClient();

  // Fetch proposals for the classroom
  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ['/api/proposals/classroom', selectedClassroom?.id, selectedStatus, selectedPriority],
    enabled: !!selectedClassroom?.id,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPriority !== "all") params.append("priority", selectedPriority);
      const url = `/api/proposals/classroom/${selectedClassroom!.id}${params.toString() ? `?${params.toString()}` : ''}`;
      return apiRequest(url, 'GET');
    }
  });

  const proposals: Proposal[] = Array.isArray(proposalsData) ? proposalsData : [];

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => apiRequest('/api/notifications?unreadOnly=true', 'GET')
  });

  const notifications: ProposalNotification[] = Array.isArray(notificationsData) ? notificationsData : [];

  // Review proposal mutation
  const reviewProposalMutation = useMutation({
    mutationFn: ({ proposalId, action, feedback }: { proposalId: string; action: string; feedback: string }) =>
      apiRequest(`/api/proposals/${proposalId}/review`, 'POST', { action, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals/classroom'] });
      setShowDetailsDialog(false);
      setReviewFeedback("");
    }
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: ({ proposalId, progressPercentage, completedMilestones }: any) =>
      apiRequest(`/api/proposals/${proposalId}/progress`, 'PATCH', { progressPercentage, completedMilestones }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals/classroom'] });
    }
  });

  // Create RFP mutation
  const createRFPMutation = useMutation({
    mutationFn: (rfpData: any) =>
      apiRequest('/api/assignments', 'POST', {
        ...rfpData,
        isRFP: true,
        classroomId: selectedClassroom?.id,
        teacherId: user?.id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals/classroom'] });
      setShowCreateRFPDialog(false);
      // Reset form
      setRfpTitle("");
      setRfpDescription("");
      setRfpRequirements("");
      setRfpBudget("");
      setRfpDeadline("");
      setRfpVisibility("public");
      setRfpTokenReward("");
    }
  });

  const filteredProposals = proposals.filter((proposal: Proposal) => {
    if (selectedStatus !== "all" && proposal.status !== selectedStatus) return false;
    if (selectedPriority !== "all" && proposal.priority !== selectedPriority) return false;
    return true;
  });

  const handleReviewSubmit = () => {
    if (!selectedProposal || !reviewAction || !reviewFeedback.trim()) return;
    
    const reviewData: any = {
      proposalId: selectedProposal.id,
      action: reviewAction,
      feedback: reviewFeedback
    };

    // Add grading data if provided and approving
    if (reviewAction === 'approve' && (proposalGrade || proposalTokens)) {
      reviewData.grade = proposalGrade ? parseFloat(proposalGrade) : undefined;
      reviewData.tokensAwarded = proposalTokens ? parseInt(proposalTokens) : undefined;
    }
    
    reviewProposalMutation.mutate(reviewData);
  };

  const handleCreateRFP = () => {
    if (!rfpTitle.trim() || !rfpDescription.trim() || !rfpTokenReward.trim()) return;
    
    createRFPMutation.mutate({
      title: rfpTitle,
      description: rfpDescription,
      instructions: rfpRequirements,
      tokenReward: parseInt(rfpTokenReward),
      dueDate: rfpDeadline ? new Date(rfpDeadline).toISOString() : null,
      category: 'project', // Default category for RFPs
      visibility: rfpVisibility
    });
  };

  const handleExportProposals = () => {
    if (!proposals || proposals.length === 0) return;

    const csvData = proposals.map(proposal => ({
      'Proposal Title': proposal.title,
      'Student Name': getStudentName(proposal.student),
      'Assignment': proposal.assignment.title,
      'Status': proposal.status,
      'Priority': proposal.priority,
      'Progress': `${proposal.progressPercentage}%`,
      'Submitted At': proposal.submittedAt ? format(new Date(proposal.submittedAt), 'yyyy-MM-dd HH:mm') : '',
      'Approved At': proposal.approvedAt ? format(new Date(proposal.approvedAt), 'yyyy-MM-dd HH:mm') : '',
      'Teacher Feedback': proposal.teacherFeedback || '',
      'Milestones': proposal.milestones?.join('; ') || '',
      'Completed Milestones': proposal.completedMilestones?.join('; ') || '',
      'Created At': format(new Date(proposal.createdAt), 'yyyy-MM-dd HH:mm')
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => 
          `"${String(row[header as keyof typeof row] || '').replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `proposals-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <Badge className={cn("text-white", config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge variant="outline" className={cn("text-white border-none", config.color)}>
        {config.label}
      </Badge>
    );
  };

  const getStudentName = (student: Proposal['student']) => {
    return student.nickname || `${student.firstName} ${student.lastName}`.trim() || 'Unknown Student';
  };

  if (!selectedClassroom) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a classroom to view proposals.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Proposals & Special Projects Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive project management and collaboration platform
          </p>
        </div>
        
        {/* Create RFP Button - Teacher Only */}
        {user?.role === 'teacher' && (
          <Button
            onClick={() => setShowCreateRFPDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            data-testid="create-rfp-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create RFP
          </Button>
        )}
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{filteredProposals.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">
                  {filteredProposals.filter(p => ['submitted', 'pending', 'under_review'].includes(p.status)).length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-sm font-medium">
                  {filteredProposals.filter(p => p.status === 'in_progress').length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">
                  {filteredProposals.filter(p => p.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters and Notifications */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {Object.entries(priorityConfig).map(([priority, config]) => (
                <SelectItem key={priority} value={priority}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notifications Badge */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>{notifications.length} unread notification(s)</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="proposals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposals">All Proposals</TabsTrigger>
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Lightbulb className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">No proposals found</h3>
                  <p className="text-muted-foreground">
                    {selectedStatus !== "all" || selectedPriority !== "all"
                      ? "Try adjusting your filters to see more proposals."
                      : "Start by creating your first proposal for a special project."}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProposals.map((proposal: Proposal) => (
                <Card 
                  key={proposal.id} 
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                  onClick={() => {
                    setSelectedProposal(proposal);
                    setShowDetailsDialog(true);
                  }}
                  data-testid={`proposal-card-${proposal.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg leading-tight line-clamp-2">
                          {proposal.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {proposal.assignment.title}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProposal(proposal);
                            setShowDetailsDialog(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {user?.role === 'teacher' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProposal(proposal);
                              setReviewAction("approve");
                              setShowDetailsDialog(true);
                            }}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Quick Approve
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(proposal.status)}
                      {getPriorityBadge(proposal.priority)}
                    </div>
                    
                    {/* Progress Bar for Active/Completed Projects */}
                    {['approved', 'in_progress', 'completed'].includes(proposal.status) && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{proposal.progressPercentage}%</span>
                        </div>
                        <Progress value={proposal.progressPercentage} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{getStudentName(proposal.student)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(proposal.createdAt), 'MMM d')}</span>
                      </div>
                    </div>

                    {proposal.teacherFeedback && (
                      <div className="bg-muted p-2 rounded text-xs">
                        <div className="flex items-center space-x-1 mb-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium">Latest Feedback</span>
                        </div>
                        <p className="line-clamp-2">{proposal.teacherFeedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProposals
              .filter(p => ['approved', 'in_progress'].includes(p.status))
              .map((proposal: Proposal) => (
                <Card key={proposal.id} className="border-l-4 border-l-indigo-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      {getStatusBadge(proposal.status)}
                    </div>
                    <CardDescription>{getStudentName(proposal.student)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Project Progress</span>
                        <span className="font-medium">{proposal.progressPercentage}%</span>
                      </div>
                      <Progress value={proposal.progressPercentage} />
                    </div>

                    {proposal.milestones && proposal.milestones.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Milestones</h4>
                        <div className="space-y-1">
                          {proposal.milestones.map((milestone, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                proposal.completedMilestones?.includes(milestone) 
                                  ? "bg-green-500" 
                                  : "bg-gray-300"
                              )} />
                              <span className={cn(
                                proposal.completedMilestones?.includes(milestone) 
                                  ? "line-through text-muted-foreground" 
                                  : ""
                              )}>
                                {milestone}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setShowDetailsDialog(true);
                      }}
                      data-testid={`view-proposal-${proposal.id}`}
                    >
                      View Project Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Header with Export */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Proposal Analytics</h3>
              <p className="text-sm text-muted-foreground">Track proposal performance and student engagement</p>
            </div>
            <Button
              onClick={handleExportProposals}
              disabled={!proposals || proposals.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="export-proposals-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{proposals.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {proposals.length > 0 
                    ? Math.round((proposals.filter(p => p.status === 'approved').length / proposals.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {proposals.filter(p => ['approved', 'in_progress'].includes(p.status)).length}
                </div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {proposals.filter(p => p.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">Finished</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const count = proposals.filter(p => p.status === status).length;
                  const percentage = proposals.length > 0 ? (count / proposals.length) * 100 : 0;
                  
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center space-x-2">
                          <div className={cn("w-3 h-3 rounded", config.color)} />
                          <span>{config.label}</span>
                        </span>
                        <span>{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-1" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create RFP Dialog */}
      <Dialog open={showCreateRFPDialog} onOpenChange={setShowCreateRFPDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Create New RFP (Request for Proposal)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="rfp-title" className="text-sm font-medium">Project Title *</Label>
                <Input
                  id="rfp-title"
                  value={rfpTitle}
                  onChange={(e) => setRfpTitle(e.target.value)}
                  placeholder="Enter a clear, descriptive project title..."
                  className="mt-1"
                  data-testid="rfp-title-input"
                />
              </div>

              <div>
                <Label htmlFor="rfp-description" className="text-sm font-medium">Project Description *</Label>
                <Textarea
                  id="rfp-description"
                  value={rfpDescription}
                  onChange={(e) => setRfpDescription(e.target.value)}
                  placeholder="Describe the project goals, objectives, and what students will accomplish..."
                  className="mt-1"
                  rows={4}
                  data-testid="rfp-description-input"
                />
              </div>

              <div>
                <Label htmlFor="rfp-requirements" className="text-sm font-medium">Requirements & Specifications</Label>
                <Textarea
                  id="rfp-requirements"
                  value={rfpRequirements}
                  onChange={(e) => setRfpRequirements(e.target.value)}
                  placeholder="List specific requirements, deliverables, and evaluation criteria..."
                  className="mt-1"
                  rows={4}
                  data-testid="rfp-requirements-input"
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rfp-budget" className="text-sm font-medium">Budget/Token Reward *</Label>
                <div className="mt-1 relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rfp-budget"
                    type="number"
                    value={rfpTokenReward}
                    onChange={(e) => setRfpTokenReward(e.target.value)}
                    placeholder="Token reward amount"
                    className="pl-10"
                    data-testid="rfp-token-reward-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rfp-deadline" className="text-sm font-medium">Project Deadline</Label>
                <Input
                  id="rfp-deadline"
                  type="datetime-local"
                  value={rfpDeadline}
                  onChange={(e) => setRfpDeadline(e.target.value)}
                  className="mt-1"
                  data-testid="rfp-deadline-input"
                />
              </div>
            </div>

            {/* Visibility Settings */}
            <div>
              <Label className="text-sm font-medium">RFP Visibility</Label>
              <Select value={rfpVisibility} onValueChange={(value: "public" | "private") => setRfpVisibility(value)}>
                <SelectTrigger className="mt-1" data-testid="rfp-visibility-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - All students can see and submit proposals</SelectItem>
                  <SelectItem value="private">Private - Only invited students can participate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateRFPDialog(false)}
                data-testid="cancel-rfp-button"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRFP}
                disabled={!rfpTitle.trim() || !rfpDescription.trim() || !rfpTokenReward.trim() || createRFPMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                data-testid="submit-rfp-button"
              >
                {createRFPMutation.isPending ? "Creating..." : "Create RFP"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proposal Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>{selectedProposal?.title}</span>
              </span>
              {selectedProposal && getStatusBadge(selectedProposal.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Student</Label>
                  <p className="text-sm">{getStudentName(selectedProposal.student)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Assignment</Label>
                  <p className="text-sm">{selectedProposal.assignment.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedProposal.priority)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p className="text-sm">
                    {selectedProposal.submittedAt 
                      ? format(new Date(selectedProposal.submittedAt), 'PPP') 
                      : 'Not submitted'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Content */}
              <div>
                <Label className="text-sm font-medium">Proposal Content</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedProposal.content}</p>
                </div>
              </div>

              {selectedProposal.scopeOfWork && (
                <div>
                  <Label className="text-sm font-medium">Scope of Work</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedProposal.scopeOfWork}</p>
                  </div>
                </div>
              )}

              {/* Progress Section */}
              {['approved', 'in_progress', 'completed'].includes(selectedProposal.status) && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Project Progress</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completion</span>
                        <span className="font-medium">{selectedProposal.progressPercentage}%</span>
                      </div>
                      <Progress value={selectedProposal.progressPercentage} />
                    </div>
                  </div>

                  {selectedProposal.milestones && selectedProposal.milestones.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Project Milestones</Label>
                      <div className="mt-2 space-y-2">
                        {selectedProposal.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 rounded border">
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2",
                              selectedProposal.completedMilestones?.includes(milestone)
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300"
                            )} />
                            <span className={cn(
                              "text-sm",
                              selectedProposal.completedMilestones?.includes(milestone)
                                ? "line-through text-muted-foreground"
                                : ""
                            )}>
                              {milestone}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Teacher Feedback */}
              {selectedProposal.teacherFeedback && (
                <div>
                  <Separator />
                  <Label className="text-sm font-medium">Teacher Feedback</Label>
                  <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm">{selectedProposal.teacherFeedback}</p>
                  </div>
                </div>
              )}

              {/* Review Actions (Teacher Only) */}
              {user?.role === 'teacher' && ['submitted', 'pending', 'under_review', 'needs_revision'].includes(selectedProposal.status) && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Review Actions</Label>
                    <div className="mt-2 space-y-4">
                      <Select value={reviewAction} onValueChange={setReviewAction}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select review action..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">Approve Proposal</SelectItem>
                          <SelectItem value="reject">Reject Proposal</SelectItem>
                          <SelectItem value="request_revision">Request Revision</SelectItem>
                        </SelectContent>
                      </Select>

                      <div>
                        <Label htmlFor="feedback" className="text-sm font-medium">
                          Feedback Message
                        </Label>
                        <Textarea
                          id="feedback"
                          value={reviewFeedback}
                          onChange={(e) => setReviewFeedback(e.target.value)}
                          placeholder="Provide detailed feedback to the student..."
                          className="mt-1"
                          rows={4}
                        />
                      </div>

                      {/* Grading Section - Only show when approving */}
                      {reviewAction === 'approve' && (
                        <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-green-600" />
                            <Label className="text-sm font-medium text-green-800">Grade & Reward Assignment</Label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="proposal-grade" className="text-sm font-medium">Grade (0-100)</Label>
                              <Input
                                id="proposal-grade"
                                type="number"
                                min="0"
                                max="100"
                                value={proposalGrade}
                                onChange={(e) => setProposalGrade(e.target.value)}
                                placeholder="85"
                                className="mt-1"
                                data-testid="proposal-grade-input"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="proposal-tokens" className="text-sm font-medium">Bonus Tokens</Label>
                              <div className="mt-1 relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="proposal-tokens"
                                  type="number"
                                  min="0"
                                  value={proposalTokens}
                                  onChange={(e) => setProposalTokens(e.target.value)}
                                  placeholder="Bonus tokens"
                                  className="pl-10"
                                  data-testid="proposal-tokens-input"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-xs text-green-700">
                            Grade and tokens will be automatically recorded when the proposal is approved.
                          </p>
                        </div>
                      )}

                      <Button 
                        onClick={handleReviewSubmit}
                        disabled={!reviewAction || !reviewFeedback.trim() || reviewProposalMutation.isPending}
                        className="w-full"
                        data-testid="submit-review-button"
                      >
                        {reviewProposalMutation.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}