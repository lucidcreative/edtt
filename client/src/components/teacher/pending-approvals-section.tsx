import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PendingAssignment {
  id: string;
  title: string;
  studentName: string;
  studentId: string;
  category: string;
  tokenReward: number;
  dueDate?: string;
  submittedAt?: string;
  grade?: number;
}

interface PendingApprovalsSectionProps {
  classroomId: string;
}

export function PendingApprovalsSection({ classroomId }: PendingApprovalsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get assignments pending approval
  const { data: pendingAssignments = [], isLoading } = useQuery<PendingAssignment[]>({
    queryKey: ["/api/classrooms", classroomId, "assignments", "pending-approval"],
    enabled: !!classroomId
  });

  // Approve completion mutation
  const approveCompletionMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest(`/api/assignments/${assignmentId}/approve-completion`, {
        method: 'POST',
        body: {}
      });
    },
    onSuccess: (_, assignmentId) => {
      const assignment = pendingAssignments.find(a => a.id === assignmentId);
      toast({ 
        title: "Assignment Approved! ✅", 
        description: `${assignment?.studentName} has been awarded ${assignment?.tokenReward} tokens for completing "${assignment?.title}".`,
        duration: 5000
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "assignments", "pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "assignments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve completion. Please try again.", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-clock text-orange-500"></i>
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingAssignments.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-clock text-orange-500"></i>
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-check-circle text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-sm">No completion requests pending approval</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-clock text-orange-500"></i>
          Pending Approvals ({pendingAssignments.length})
        </CardTitle>
        <p className="text-sm text-gray-600">Students waiting for you to approve their assignment completions</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Student and Assignment Info */}
                    <div>
                      <h4 className="font-semibold text-gray-800 line-clamp-1">{assignment.title}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <i className="fas fa-user"></i>
                        {assignment.studentName}
                      </p>
                    </div>
                    
                    {/* Assignment Details */}
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        <i className="fas fa-coins mr-1"></i>
                        {assignment.tokenReward} tokens
                      </Badge>
                      {assignment.grade && (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          Grade: {assignment.grade}%
                        </Badge>
                      )}
                    </div>
                    
                    {/* Submission Time */}
                    {assignment.submittedAt && (
                      <p className="text-xs text-gray-500">
                        <i className="fas fa-paper-plane mr-1"></i>
                        Submitted {new Date(assignment.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                    
                    {/* Approve Button */}
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approveCompletionMutation.mutate(assignment.id)}
                      disabled={approveCompletionMutation.isPending}
                      data-testid={`button-approve-${assignment.id}`}
                    >
                      {approveCompletionMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Approving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check mr-2"></i>
                          Approve Completion
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}