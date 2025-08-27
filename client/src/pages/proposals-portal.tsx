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
  DollarSign,
  Crown,
  Coins,
  Wallet,
  Shield,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Proposal {
  id: string;
  title: string;
  content: string;
  scopeOfWork?: string;
  status: 'draft' | 'submitted' | 'pending' | 'under_review' | 'needs_revision' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'winner_selected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progressPercentage: number;
  milestones?: string[];
  completedMilestones?: string[];
  teacherFeedback?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Winner selection and payment fields
  isWinner?: boolean;
  selectedAt?: string;
  selectedBy?: string;
  projectBudget?: number;
  paymentType?: 'full_payment' | 'split_payment';
  paymentSchedule?: any[];
  escrowStatus?: 'pending' | 'in_escrow' | 'partially_released' | 'fully_released' | 'disputed';
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
  completed: { color: "bg-emerald-500", label: "Completed", icon: Award },
  winner_selected: { color: "bg-yellow-600", label: "Winner Selected", icon: Crown }
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
  
  // Winner selection and payment management state
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [projectBudget, setProjectBudget] = useState<number>(100);
  const [paymentType, setPaymentType] = useState<'full_payment' | 'split_payment'>('full_payment');
  const [paymentSchedule, setPaymentSchedule] = useState<Array<{title: string, description: string, percentage: number, dueDate: string}>>([
    { title: "Phase 1 - Initial Setup", description: "Project setup and planning", percentage: 50, dueDate: "" },
    { title: "Phase 2 - Completion", description: "Final deliverables and review", percentage: 50, dueDate: "" }
  ]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
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

  // Winner selection mutation
  const selectWinnerMutation = useMutation({
    mutationFn: ({ proposalId, budget, paymentType, schedules }: { 
      proposalId: string; 
      budget: number; 
      paymentType: 'full_payment' | 'split_payment';
      schedules?: Array<{title: string, description?: string, percentage: number, dueDate?: string}>;
    }) =>
      apiRequest(`/api/proposals/${proposalId}/select-winner`, 'POST', { 
        budget, 
        paymentType,
        schedules: paymentType === 'split_payment' ? schedules : undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals/classroom'] });
      setShowWinnerDialog(false);
      setProjectBudget(100);
      setPaymentType('full_payment');
    }
  });

  // Escrow release mutation
  const releaseEscrowMutation = useMutation({
    mutationFn: ({ transactionId, notes }: { transactionId: string; notes?: string }) =>
      apiRequest(`/api/escrow/${transactionId}/release`, 'POST', { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals/classroom'] });
    }
  });

  const filteredProposals = proposals.filter((proposal: Proposal) => {
    if (selectedStatus !== "all" && proposal.status !== selectedStatus) return false;
    if (selectedPriority !== "all" && proposal.priority !== selectedPriority) return false;
    return true;
  });

  // Helper functions
  const getStudentName = (student: { nickname?: string; firstName?: string; lastName?: string }) => {
    if (student.nickname) return student.nickname;
    if (student.firstName || student.lastName) {
      return `${student.firstName || ''} ${student.lastName || ''}`.trim();
    }
    return 'Unknown Student';
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || FileText;
    return (
      <Badge className={cn("text-white", config?.color)}>
        <Icon className="h-3 w-3 mr-1" />
        {config?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge variant="outline" className={cn("text-white", config?.color)}>
        {config?.label || priority}
      </Badge>
    );
  };

  const handleReviewSubmit = () => {
    if (!selectedProposal || !reviewAction || !reviewFeedback.trim()) return;
    
    reviewProposalMutation.mutate({
      proposalId: selectedProposal.id,
      action: reviewAction,
      feedback: reviewFeedback
    });
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
                          
                          {/* Winner Selection for Teachers */}
                          {user?.role === 'teacher' && proposal.status === 'approved' && !proposal.isWinner && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProposal(proposal);
                              setShowWinnerDialog(true);
                            }}>
                              <Crown className="h-4 w-4 mr-2" />
                              Select as Winner
                            </DropdownMenuItem>
                          )}
                          
                          {/* Payment Management for Winners */}
                          {user?.role === 'teacher' && proposal.isWinner && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProposal(proposal);
                              setShowPaymentDialog(true);
                            }}>
                              <Wallet className="h-4 w-4 mr-2" />
                              Manage Payment
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

      {/* Winner Selection Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <span>Select Winner & Set Budget</span>
            </DialogTitle>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-6">
              {/* Proposal Info */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium">{selectedProposal.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {getStudentName(selectedProposal.student)}
                </p>
              </div>

              {/* Budget Setting */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Project Budget (Tokens)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(Number(e.target.value))}
                    min="1"
                    className="mt-1"
                  />
                </div>

                {/* Payment Type Selection */}
                <div>
                  <Label>Payment Type</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="full_payment"
                        name="paymentType"
                        value="full_payment"
                        checked={paymentType === 'full_payment'}
                        onChange={(e) => setPaymentType(e.target.value as 'full_payment')}
                      />
                      <Label htmlFor="full_payment" className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Full Payment</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="split_payment"
                        name="paymentType"
                        value="split_payment"
                        checked={paymentType === 'split_payment'}
                        onChange={(e) => setPaymentType(e.target.value as 'split_payment')}
                      />
                      <Label htmlFor="split_payment" className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4" />
                        <span>Split Payment (Milestones)</span>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Payment Schedule for Split Payments */}
                {paymentType === 'split_payment' && (
                  <div className="space-y-4 border p-4 rounded-lg">
                    <h4 className="font-medium">Payment Schedule</h4>
                    {paymentSchedule.map((schedule, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted rounded">
                        <div>
                          <Label>Milestone Title</Label>
                          <Input
                            value={schedule.title}
                            onChange={(e) => {
                              const updated = [...paymentSchedule];
                              updated[index].title = e.target.value;
                              setPaymentSchedule(updated);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Percentage</Label>
                          <Input
                            type="number"
                            value={schedule.percentage}
                            onChange={(e) => {
                              const updated = [...paymentSchedule];
                              updated[index].percentage = Number(e.target.value);
                              setPaymentSchedule(updated);
                            }}
                            min="1"
                            max="100"
                          />
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={schedule.dueDate}
                            onChange={(e) => {
                              const updated = [...paymentSchedule];
                              updated[index].dueDate = e.target.value;
                              setPaymentSchedule(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      Total: {paymentSchedule.reduce((sum, schedule) => sum + schedule.percentage, 0)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowWinnerDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedProposal) {
                      selectWinnerMutation.mutate({
                        proposalId: selectedProposal.id,
                        budget: projectBudget,
                        paymentType,
                        schedules: paymentType === 'split_payment' ? paymentSchedule : undefined
                      });
                    }
                  }}
                  disabled={selectWinnerMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {selectWinnerMutation.isPending ? 'Selecting...' : 'Select Winner'}
                  <Crown className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Management Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <span>Payment Management</span>
            </DialogTitle>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{selectedProposal.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {getStudentName(selectedProposal.student)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{selectedProposal.projectBudget} tokens</p>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                  </div>
                </div>
              </div>

              {/* Escrow Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Escrow Status</p>
                    <p className="text-sm text-muted-foreground">
                      Funds are securely held until milestone completion
                    </p>
                  </div>
                </div>
                <Badge variant={selectedProposal.escrowStatus === 'in_escrow' ? 'default' : 'secondary'}>
                  {selectedProposal.escrowStatus?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Payment Type Display */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {selectedProposal.paymentType === 'full_payment' ? (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Full Payment</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      <span>Split Payment</span>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Schedule (for split payments) */}
              {selectedProposal.paymentType === 'split_payment' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Payment Schedule</h4>
                  <div className="space-y-3">
                    {paymentSchedule.map((schedule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <p className="font-medium">{schedule.title}</p>
                          <p className="text-sm text-muted-foreground">{schedule.description}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-medium">{schedule.percentage}%</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((selectedProposal.projectBudget || 0) * schedule.percentage / 100)} tokens
                          </p>
                        </div>
                        <div className="ml-4">
                          <Button size="sm" variant="outline">
                            Release Payment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Payment Release */}
              {selectedProposal.paymentType === 'full_payment' && (
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Full Project Payment</p>
                      <p className="text-sm text-muted-foreground">Release full budget upon completion</p>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Coins className="h-4 w-4 mr-2" />
                      Release {selectedProposal.projectBudget} Tokens
                    </Button>
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