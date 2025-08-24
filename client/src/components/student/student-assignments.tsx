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

  // Request completion approval (no tokens awarded yet)
  const requestCompletionMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest('POST', `/api/assignments/${assignmentId}/request-completion`, {});
    },
    onSuccess: () => {
      toast({ 
        title: "Completion Requested! ✋", 
        description: "Your teacher will review and approve your completion request.",
        duration: 5000
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "assignments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to request completion. Please try again.", variant: "destructive" });
    }
  });

  const handleSubmitAssignment = () => {
    if (!selectedAssignment || !submissionText.trim()) return;
    
    submitAssignmentMutation.mutate({
      assignmentId: selectedAssignment.id,
      submission: submissionText
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
        return <Badge variant="outline" className="bg-blue-100 text-blue-600 border-blue-200">📝 To Do</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-600 border-yellow-200">⏳ Under Review</Badge>;
      case 'graded':
        return <Badge variant="outline" className="bg-purple-100 text-purple-600 border-purple-200">✅ Ready to Complete</Badge>;
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
      case 'submitted':
        return "fas fa-paper-plane";
      case 'graded':
        return "fas fa-star";
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
                        {assignment.status === 'assigned' ? (
                          <Button 
                            className="flex-1"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsSubmitDialogOpen(true);
                            }}
                            data-testid={`button-submit-${assignment.id}`}
                          >
                            <i className="fas fa-paper-plane mr-2"></i>
                            Submit Work
                          </Button>
                        ) : assignment.status === 'submitted' ? (
                          <Button variant="outline" className="flex-1" disabled>
                            <i className="fas fa-clock mr-2"></i>
                            Awaiting Grade
                          </Button>
                        ) : assignment.status === 'graded' ? (
                          <Button 
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                            onClick={() => requestCompletionMutation.mutate(assignment.id)}
                            disabled={requestCompletionMutation.isPending}
                            data-testid={`button-request-completion-${assignment.id}`}
                          >
                            {requestCompletionMutation.isPending ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Requesting...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-hand-paper mr-2"></i>
                                Request Completion
                              </>
                            )}
                          </Button>
                        ) : assignment.status === 'pending_approval' ? (
                          <Button variant="outline" className="flex-1 bg-orange-50 border-orange-200 text-orange-700" disabled>
                            <i className="fas fa-clock mr-2"></i>
                            Awaiting Approval
                          </Button>
                        ) : (
                          <Button variant="outline" className="flex-1 bg-green-50 border-green-200 text-green-700" disabled>
                            <i className="fas fa-check-circle mr-2"></i>
                            Completed
                          </Button>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" data-testid={`button-view-${assignment.id}`}>
                              <i className="fas fa-eye"></i>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{assignment.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {assignment.description && (
                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                                </div>
                              )}
                              
                              {assignment.resources && assignment.resources.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Resources</Label>
                                  <div className="space-y-2 mt-1">
                                    {assignment.resources.map((resource, idx) => (
                                      <a
                                        key={idx}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                                      >
                                        <i className="fas fa-external-link-alt"></i>
                                        {resource.title}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-600">
                                    <i className="fas fa-coins text-yellow-500 mr-1"></i>
                                    {assignment.tokenReward} tokens
                                  </span>
                                  {assignment.dueDate && (
                                    <span className="text-sm text-gray-600">
                                      <i className="fas fa-calendar text-blue-500 mr-1"></i>
                                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                {getStatusBadge(assignment.status)}
                              </div>
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
            <DialogTitle>Submit Assignment: {selectedAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="submission">Your Work</Label>
              <Textarea
                id="submission"
                placeholder="Type your assignment response here, include links to any files or documents..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                className="min-h-[200px] mt-2"
                data-testid="textarea-assignment-submission"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can include text, links to documents, or describe your work. Make sure to include all required elements.
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
                  onClick={handleSubmitAssignment}
                  disabled={!submissionText.trim() || submitAssignmentMutation.isPending}
                  data-testid="button-confirm-submit-assignment"
                >
                  {submitAssignmentMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Submit Assignment
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