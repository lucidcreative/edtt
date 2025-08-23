import { useState } from "react";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

export default function ClassroomSelector() {
  const { user } = useAuth();
  const { currentClassroom, classrooms, enrollments, setSelectedClassroom, refreshClassrooms } = useClassroom();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Join classroom mutation
  const joinClassroomMutation = useMutation({
    mutationFn: async (classroomCode: string) => {
      const response = await apiRequest('POST', '/api/classrooms/join', { classroomCode });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Classroom Joined", 
        description: `Successfully joined ${data.classroom?.name || 'classroom'}!` 
      });
      refreshClassrooms();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsJoinDialogOpen(false);
      setJoinCode("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to Join", 
        description: error.message || "Could not join classroom. Check the code and try again.", 
        variant: "destructive" 
      });
    }
  });

  const handleJoinClassroom = () => {
    if (!joinCode.trim()) {
      toast({ title: "Enter Classroom Code", description: "Please enter a valid classroom code.", variant: "destructive" });
      return;
    }
    joinClassroomMutation.mutate(joinCode.trim().toUpperCase());
  };

  if (user?.role !== 'student') {
    return null;
  }

  const approvedClassrooms = classrooms;
  const pendingEnrollments = enrollments.filter(e => e.enrollmentStatus === 'pending');

  return (
    <div className="space-y-4">
      {/* Current Classroom Display */}
      {currentClassroom && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800">{currentClassroom.name}</h3>
                <p className="text-sm text-blue-600">Current Classroom</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classroom Selection */}
      {approvedClassrooms.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="fas fa-school text-blue-500"></i>
              Switch Classroom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={currentClassroom?.id || ""} 
              onValueChange={(value) => {
                const classroom = approvedClassrooms.find(c => c.id === value);
                setSelectedClassroom(classroom || null);
              }}
            >
              <SelectTrigger data-testid="select-classroom">
                <SelectValue placeholder="Select a classroom" />
              </SelectTrigger>
              <SelectContent>
                {approvedClassrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    <div className="flex items-center gap-2">
                      <span>{classroom.name}</span>
                      {classroom.subject && (
                        <Badge variant="outline" className="text-xs">
                          {classroom.subject}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* My Classrooms List */}
      {approvedClassrooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="fas fa-list text-green-500"></i>
              My Classrooms ({approvedClassrooms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvedClassrooms.map((classroom, index) => (
                <motion.div
                  key={classroom.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    currentClassroom?.id === classroom.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedClassroom(classroom)}
                  data-testid={`classroom-item-${classroom.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{classroom.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {classroom.subject && (
                          <Badge variant="outline" className="text-xs">
                            {classroom.subject}
                          </Badge>
                        )}
                        {classroom.gradeLevel && (
                          <Badge variant="outline" className="text-xs">
                            Grade {classroom.gradeLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {currentClassroom?.id === classroom.id && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <i className="fas fa-check mr-1"></i>
                        Active
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Enrollments */}
      {pendingEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <i className="fas fa-clock text-yellow-500"></i>
              Pending Approval ({pendingEnrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingEnrollments.map((enrollment, index) => (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{enrollment.classroom.name}</h4>
                      <p className="text-sm text-gray-600">Waiting for teacher approval</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join New Classroom */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <i className="fas fa-plus text-purple-500"></i>
            Join Another Classroom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" data-testid="button-join-classroom">
                <i className="fas fa-plus mr-2"></i>
                Join Classroom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join New Classroom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="joinCode">Classroom Code</Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter 6-character code (e.g., ABC123)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="mt-1"
                    data-testid="input-join-code"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ask your teacher for the classroom code
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsJoinDialogOpen(false);
                      setJoinCode("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleJoinClassroom}
                    disabled={joinClassroomMutation.isPending || !joinCode.trim()}
                    data-testid="button-confirm-join"
                  >
                    {joinClassroomMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Joining...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        Join Classroom
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}