import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  category: string;
  tokenReward: number;
  dueDate?: string;
  status: 'assigned' | 'submitted' | 'graded' | 'pending_approval' | 'completed';
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  resources?: { title: string; url: string; }[];
  isRFP?: boolean;
  proposalStatus?: 'pending' | 'approved' | 'not_selected';
}

const categories = [
  { value: "math", label: "Math", icon: "fas fa-calculator", color: "bg-red-100 text-red-600" },
  { value: "science", label: "Science", icon: "fas fa-flask", color: "bg-blue-100 text-blue-600" },
  { value: "history", label: "History", icon: "fas fa-landmark", color: "bg-green-100 text-green-600" },
  { value: "english", label: "English", icon: "fas fa-book", color: "bg-purple-100 text-purple-600" },
  { value: "art", label: "Art", icon: "fas fa-palette", color: "bg-pink-100 text-pink-600" },
];

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Get student's assignments
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/students", user?.id, "assignments"],
    enabled: !!user?.id && user?.role === 'student'
  });

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, submission }: { assignmentId: string; submission: string }) => {
      return apiRequest('POST', `/api/assignments/${assignmentId}/submit`, { submission });
    },
    onSuccess: () => {
      toast({ title: "Assignment Submitted", description: "Your assignment has been submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "assignments"] });
      setIsSubmitDialogOpen(false);
      setSubmissionText("");
      setSelectedAssignment(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit assignment. Please try again.", variant: "destructive" });
    }
  });

  // SIMPLIFIED: Mark assignment as complete (no submission needed)
  const markCompleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest('POST', `/api/assignments/${assignmentId}/mark-complete`, {});
    },
    onSuccess: () => {
      toast({ 
        title: "Assignment Completed! ✅", 
        description: "Your assignment has been sent to your teacher for approval.",
        duration: 5000
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "assignments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark assignment as complete. Please try again.", variant: "destructive" });
    }
  });

  // Proposal submission mutation for RFP assignments
  const submitProposalMutation = useMutation({
    mutationFn: async ({ assignmentId, content }: { assignmentId: string; content: string }) => {
      return apiRequest('POST', '/api/proposals', { assignmentId, content });
    },
    onSuccess: () => {
      toast({ 
        title: "Proposal Submitted! 💡", 
        description: "Your proposal has been submitted and is now under review.",
        duration: 5000
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "assignments"] });
      setIsSubmitDialogOpen(false);
      setSubmissionText("");
      setSelectedAssignment(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to submit proposal. Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

  // Unmark assignment as complete mutation
  const unmarkCompleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest('POST', `/api/assignments/${assignmentId}/unmark-complete`, {});
    },
    onSuccess: () => {
      toast({ 
        title: "Assignment Unmarked ↩️", 
        description: "You can now rework and resubmit this assignment.",
        duration: 5000
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "assignments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unmark assignment. Please try again.", variant: "destructive" });
    }
  });

  const handleSubmitAssignment = () => {
    if (!selectedAssignment || !submissionText.trim()) return;
    
    submitAssignmentMutation.mutate({
      assignmentId: selectedAssignment.id,
      submission: submissionText
    });
  };

  const handleSubmitProposal = () => {
    if (!selectedAssignment || !submissionText.trim()) return;
    
    submitProposalMutation.mutate({
      assignmentId: selectedAssignment.id,
      content: submissionText
    });
  };

  const filteredAssignments = selectedCategory === "all" 
    ? assignments 
    : assignments.filter(assignment => assignment.category === selectedCategory);

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || { label: category, icon: "fas fa-file", color: "bg-gray-100 text-gray-600" };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-600 border-blue-200">📝 Incomplete</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-orange-100 text-orange-600 border-orange-200">⏳ Awaiting Approval</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-600 border-green-200">🎉 Completed</Badge>;
      default:
        return <Badge variant="outline">❓ Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return "fas fa-tasks";
      case 'pending_approval':
        return "fas fa-clock";
      case 'completed':
        return "fas fa-check-circle";
      default:
        return "fas fa-question-circle";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800">My Assignments</h1>
        <p className="text-gray-600 mt-1">Complete assignments to earn tokens and level up!</p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
          className="mb-2"
          data-testid="filter-all-assignments"
        >
          All Assignments
        </Button>
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.value)}
            className="mb-2"
            data-testid={`filter-${category.value}-assignments`}
          >
            <i className={`${category.icon} mr-2`}></i>
            {category.label}
          </Button>
        ))}
      </motion.div>

      {/* Assignments Grid */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment, index) => {
            const categoryInfo = getCategoryInfo(assignment.category);
            
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 group h-full flex flex-col ${
                  assignment.status === 'completed' ? 'border-green-500 bg-green-50' : 
                  assignment.status === 'pending_approval' ? 'border-orange-300 bg-orange-50' : ''
                }`}>
                  <CardHeader className="pb-4">
                    <div className="space-y-4">
                      {/* Status and Category Row */}
                      <div className="flex items-center justify-between">
                        {getStatusBadge(assignment.status)}
                        <Badge variant="outline" className={categoryInfo.color}>
                          <i className={`${categoryInfo.icon} mr-1`}></i>
                          {categoryInfo.label}
                        </Badge>
                      </div>
                      
                      {/* Icon and Title Row */}
                      <div className="flex items-start gap-4">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg ${
                          assignment.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                          assignment.status === 'pending_approval' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          'bg-gradient-to-r from-blue-500 to-purple-600'
                        } group-hover:scale-105 transition-transform duration-300`}>
                          <i className={`${getStatusIcon(assignment.status)} text-xl`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors leading-tight mb-2">
                            {assignment.title}
                          </CardTitle>
                          {assignment.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{assignment.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      {/* Reward and Due Date Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-coins text-yellow-600"></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-yellow-800">{assignment.tokenReward} tokens</p>
                            <p className="text-xs text-yellow-600">Reward for completion</p>
                          </div>
                        </div>
                        
                        {assignment.dueDate && (
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-calendar text-blue-600"></i>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-blue-800">
                                {new Date(assignment.dueDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-blue-600">Due date</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {assignment.status === 'graded' && assignment.grade && (
                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-star text-green-600"></i>
                              <span className="font-semibold text-green-800">Grade: {assignment.grade}%</span>
                            </div>
                          </div>
                          {assignment.feedback && (
                            <p className="text-sm text-green-700 mt-2">"{assignment.feedback}"</p>
                          )}
                        </div>
                      )}

                      {assignment.status === 'completed' && (
                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-check-circle text-green-600"></i>
                            <span className="font-semibold text-green-800">Completed & Tokens Earned!</span>
                          </div>
                        </div>
                      )}
                      
                      {assignment.status === 'pending_approval' && (
                        <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-clock text-orange-600"></i>
                            <span className="font-semibold text-orange-800">Awaiting Teacher Approval</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Fixed at bottom */}
                    <div className="flex items-center gap-2 pt-4 mt-auto">
                        {assignment.isRFP ? (
                          // RFP Assignment Buttons
                          assignment.proposalStatus === 'pending' ? (
                            <Button variant="outline" className="flex-1 bg-blue-50 border-blue-200 text-blue-700" disabled>
                              <i className="fas fa-clock mr-2"></i>
                              Proposal Under Review
                            </Button>
                          ) : assignment.proposalStatus === 'approved' ? (
                            <Button variant="outline" className="flex-1 bg-green-50 border-green-200 text-green-700" disabled>
                              <i className="fas fa-trophy mr-2"></i>
                              Proposal Approved
                            </Button>
                          ) : assignment.proposalStatus === 'not_selected' ? (
                            <Button variant="outline" className="flex-1 bg-gray-50 border-gray-200 text-gray-600" disabled>
                              <i className="fas fa-times mr-2"></i>
                              Not Selected
                            </Button>
                          ) : (
                            <Button 
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setIsSubmitDialogOpen(true);
                              }}
                              data-testid={`button-submit-proposal-${assignment.id}`}
                            >
                              <i className="fas fa-lightbulb mr-2"></i>
                              Submit Proposal
                            </Button>
                          )
                        ) : (
                          // Regular Assignment Buttons
                          assignment.status === 'assigned' ? (
                            <Button 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => markCompleteMutation.mutate(assignment.id)}
                              disabled={markCompleteMutation.isPending}
                              data-testid={`button-mark-complete-${assignment.id}`}
                            >
                              {markCompleteMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  Marking Complete...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-check mr-2"></i>
                                  Mark as Complete
                                </>
                              )}
                            </Button>
                          ) : assignment.status === 'pending_approval' ? (
                            <Button 
                              variant="outline" 
                              className="flex-1 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                              onClick={() => unmarkCompleteMutation.mutate(assignment.id)}
                              disabled={unmarkCompleteMutation.isPending}
                              data-testid={`button-unmark-complete-${assignment.id}`}
                            >
                              {unmarkCompleteMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  Unmarking...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-undo mr-2"></i>
                                  Unmark as Complete
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button variant="outline" className="flex-1 bg-green-50 border-green-200 text-green-700" disabled>
                              <i className="fas fa-check-circle mr-2"></i>
                              Completed
                            </Button>
                          )
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" data-testid={`button-view-${assignment.id}`}>
                              <i className="fas fa-eye"></i>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${
                                  assignment.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                                  assignment.status === 'pending_approval' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                  'bg-gradient-to-r from-blue-500 to-purple-600'
                                }`}>
                                  <i className={`${getStatusIcon(assignment.status)} text-lg`}></i>
                                </div>
                                <div>
                                  <h2 className="text-xl font-bold">{assignment.title}</h2>
                                  {getStatusBadge(assignment.status)}
                                </div>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Assignment Type and Category */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                  <Label className="text-sm font-medium text-blue-800">Category</Label>
                                  <p className="text-sm text-blue-600 mt-1 flex items-center gap-2">
                                    <i className={getCategoryInfo(assignment.category).icon}></i>
                                    {getCategoryInfo(assignment.category).label}
                                  </p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                  <Label className="text-sm font-medium text-purple-800">Assignment Type</Label>
                                  <p className="text-sm text-purple-600 mt-1 flex items-center gap-2">
                                    <i className={assignment.isRFP ? "fas fa-lightbulb" : "fas fa-tasks"}></i>
                                    {assignment.isRFP ? "RFP (Request for Proposal)" : "Regular Assignment"}
                                  </p>
                                </div>
                              </div>

                              {/* Description */}
                              {assignment.description && (
                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <div className="bg-gray-50 p-4 rounded-lg mt-2 border">
                                    <p className="text-sm text-gray-700 leading-relaxed">{assignment.description}</p>
                                  </div>
                                </div>
                              )}

                              {/* Reward and Due Date */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <Label className="text-sm font-medium text-yellow-800">Token Reward</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    <i className="fas fa-coins text-yellow-600 text-lg"></i>
                                    <span className="text-xl font-bold text-yellow-800">{assignment.tokenReward}</span>
                                    <span className="text-sm text-yellow-600">tokens</span>
                                  </div>
                                </div>
                                {assignment.dueDate && (
                                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                    <Label className="text-sm font-medium text-red-800">Due Date</Label>
                                    <div className="flex items-center gap-2 mt-2">
                                      <i className="fas fa-calendar text-red-600"></i>
                                      <span className="text-sm font-semibold text-red-700">
                                        {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Assignment Status Details */}
                              <div className="p-4 rounded-lg border-2 border-dashed">
                                <Label className="text-sm font-medium">Current Status</Label>
                                <div className="mt-3">
                                  {assignment.status === 'assigned' && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                      <i className="fas fa-play-circle text-blue-600 text-xl"></i>
                                      <div>
                                        <p className="font-semibold text-blue-800">Ready to Start</p>
                                        <p className="text-xs text-blue-600">Click 'Mark as Complete' when you finish the work</p>
                                      </div>
                                    </div>
                                  )}
                                  {assignment.status === 'pending_approval' && (
                                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                                      <i className="fas fa-clock text-orange-600 text-xl"></i>
                                      <div className="flex-1">
                                        <p className="font-semibold text-orange-800">Waiting for Teacher Review</p>
                                        <p className="text-xs text-orange-600">Your teacher will review and award tokens soon</p>
                                      </div>
                                      <Button 
                                        size="sm"
                                        variant="outline"
                                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                                        onClick={() => unmarkCompleteMutation.mutate(assignment.id)}
                                        disabled={unmarkCompleteMutation.isPending}
                                      >
                                        {unmarkCompleteMutation.isPending ? 'Unmarking...' : 'Unmark'}
                                      </Button>
                                    </div>
                                  )}
                                  {assignment.status === 'completed' && (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                      <i className="fas fa-trophy text-green-600 text-xl"></i>
                                      <div>
                                        <p className="font-semibold text-green-800">Completed Successfully!</p>
                                        <p className="text-xs text-green-600">You've earned {assignment.tokenReward} tokens</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* RFP Status for RFP assignments */}
                              {assignment.isRFP && (
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                  <Label className="text-sm font-medium text-purple-800">Proposal Status</Label>
                                  <div className="mt-2">
                                    {!assignment.proposalStatus ? (
                                      <p className="text-sm text-purple-600">No proposal submitted yet</p>
                                    ) : assignment.proposalStatus === 'pending' ? (
                                      <div className="flex items-center gap-2">
                                        <i className="fas fa-hourglass-half text-blue-600"></i>
                                        <span className="text-sm font-semibold text-blue-800">Under Review</span>
                                      </div>
                                    ) : assignment.proposalStatus === 'approved' ? (
                                      <div className="flex items-center gap-2">
                                        <i className="fas fa-check-circle text-green-600"></i>
                                        <span className="text-sm font-semibold text-green-800">Proposal Approved!</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <i className="fas fa-times-circle text-red-600"></i>
                                        <span className="text-sm font-semibold text-red-800">Not Selected</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Resources */}
                              {assignment.resources && assignment.resources.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Resources & Links</Label>
                                  <div className="space-y-2 mt-2">
                                    {assignment.resources.map((resource, idx) => (
                                      <a
                                        key={idx}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border"
                                      >
                                        <i className="fas fa-external-link-alt text-blue-600"></i>
                                        <span className="text-sm font-medium text-gray-800">{resource.title}</span>
                                        <i className="fas fa-arrow-right text-gray-400 ml-auto"></i>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Submission History (if any) */}
                              {assignment.submittedAt && (
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                  <Label className="text-sm font-medium text-gray-800">Submission History</Label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <i className="fas fa-calendar-check"></i>
                                      <span>Submitted: {new Date(assignment.submittedAt).toLocaleString()}</span>
                                    </div>
                                    {assignment.grade && (
                                      <div className="flex items-center gap-2 text-sm text-green-700">
                                        <i className="fas fa-star"></i>
                                        <span>Grade: {assignment.grade}%</span>
                                      </div>
                                    )}
                                    {assignment.feedback && (
                                      <div className="p-2 bg-white rounded border">
                                        <p className="text-xs font-medium text-gray-700">Teacher Feedback:</p>
                                        <p className="text-sm text-gray-600 mt-1">"{assignment.feedback}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-tasks text-3xl text-white"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Assignments Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {selectedCategory === "all" 
              ? "Your teacher hasn't assigned any work yet. Check back soon!"
              : `No ${categories.find(c => c.value === selectedCategory)?.label} assignments available.`
            }
          </p>
        </motion.div>
      )}

      {/* Submit Assignment Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment?.isRFP ? 'Submit Proposal: ' : 'Submit Assignment: '}{selectedAssignment?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="submission">
                {selectedAssignment?.isRFP ? 'Your Proposal' : 'Your Work'}
              </Label>
              <Textarea
                id="submission"
                placeholder={
                  selectedAssignment?.isRFP 
                    ? "Describe your approach, timeline, and how you plan to complete this assignment..."
                    : "Type your assignment response here, include links to any files or documents..."
                }
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                className="min-h-[200px] mt-2"
                data-testid={selectedAssignment?.isRFP ? "textarea-proposal" : "textarea-assignment-submission"}
              />
              <p className="text-xs text-gray-500 mt-1">
                {selectedAssignment?.isRFP 
                  ? "Explain your proposed solution, methodology, and timeline. Be specific about your approach."
                  : "You can include text, links to documents, or describe your work. Make sure to include all required elements."
                }
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                <i className="fas fa-coins text-yellow-500 mr-1"></i>
                Reward: {selectedAssignment?.tokenReward} tokens
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsSubmitDialogOpen(false);
                    setSubmissionText("");
                    setSelectedAssignment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={selectedAssignment?.isRFP ? handleSubmitProposal : handleSubmitAssignment}
                  disabled={
                    !submissionText.trim() || 
                    (selectedAssignment?.isRFP ? submitProposalMutation.isPending : submitAssignmentMutation.isPending)
                  }
                  data-testid={selectedAssignment?.isRFP ? "button-confirm-submit-proposal" : "button-confirm-submit-assignment"}
                >
                  {(selectedAssignment?.isRFP ? submitProposalMutation.isPending : submitAssignmentMutation.isPending) ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      {selectedAssignment?.isRFP ? 'Submitting Proposal...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <i className={selectedAssignment?.isRFP ? "fas fa-lightbulb mr-2" : "fas fa-paper-plane mr-2"}></i>
                      {selectedAssignment?.isRFP ? 'Submit Proposal' : 'Submit Assignment'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}