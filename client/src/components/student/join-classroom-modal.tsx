import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface JoinClassroomModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function JoinClassroomModal({ children, onSuccess }: JoinClassroomModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinClassroomMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/classrooms/join', { joinCode: code });
      return await response.json();
    },
    onSuccess: (data) => {
      const isAutoApproved = data.enrollment.enrollmentStatus === 'approved';
      
      toast({
        title: isAutoApproved ? "Successfully Joined!" : "Request Sent!",
        description: isAutoApproved 
          ? `Welcome to ${data.classroom.name}! You can now access assignments and earn tokens.`
          : `Your request to join ${data.classroom.name} is pending teacher approval.`,
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      setOpen(false);
      setJoinCode("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join",
        description: error.message || "Please check the join code and try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast({
        title: "Join Code Required",
        description: "Please enter a valid classroom join code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    joinClassroomMutation.mutate(joinCode.trim().toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setJoinCode("");
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-door-open text-white text-sm"></i>
            </div>
            Join a Classroom
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="joinCode">Classroom Join Code</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter 6-digit code (e.g., ABC123)"
                maxLength={6}
                className="mt-1 uppercase text-center text-xl font-mono tracking-wider"
                data-testid="input-join-code"
                autoComplete="off"
              />
              <p className="text-sm text-gray-600 mt-1">
                Ask your teacher for the classroom join code
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                <div className="space-y-1">
                  <p className="font-medium text-blue-800">What happens next?</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Your teacher may need to approve your request</li>
                    <li>• Once approved, you'll earn tokens for completing assignments</li>
                    <li>• Spend your tokens in the classroom store</li>
                    <li>• Track your progress and compete with classmates!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              data-testid="button-cancel-join"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !joinCode.trim()}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              data-testid="button-join-classroom"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <i className="fas fa-sign-in-alt"></i>
                  Join Classroom
                </div>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}