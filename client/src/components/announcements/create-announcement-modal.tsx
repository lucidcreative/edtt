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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CreateAnnouncementModalProps {
  children: React.ReactNode;
  classroomId: string;
  onSuccess?: () => void;
}

const priorityOptions = [
  { value: "low", label: "Low", icon: "fas fa-chevron-down", color: "text-gray-500" },
  { value: "normal", label: "Normal", icon: "fas fa-minus", color: "text-blue-500" },
  { value: "high", label: "High", icon: "fas fa-chevron-up", color: "text-orange-500" },
  { value: "urgent", label: "Urgent", icon: "fas fa-exclamation", color: "text-red-500" },
];

const categoryOptions = [
  { value: "general", label: "General", icon: "fas fa-bullhorn" },
  { value: "assignment", label: "Assignment", icon: "fas fa-tasks" },
  { value: "event", label: "Event", icon: "fas fa-calendar" },
  { value: "reminder", label: "Reminder", icon: "fas fa-bell" },
  { value: "policy", label: "Class Policy", icon: "fas fa-clipboard-list" },
];

export default function CreateAnnouncementModal({ children, classroomId, onSuccess }: CreateAnnouncementModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/announcements', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Announcement Created!",
        description: `"${data.title}" has been posted to your classroom.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/classroom", classroomId] });
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const scheduledForValue = formData.get('scheduledFor') as string;
    
    const data = {
      classroomId,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      priority: formData.get('priority') as string || 'normal',
      category: formData.get('category') as string || 'general',
      scheduledFor: scheduledForValue ? new Date(scheduledForValue).toISOString() : null,
    };

    createAnnouncementMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-bullhorn text-white text-sm"></i>
            </div>
            Create Announcement
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <i className="fas fa-edit text-blue-500"></i>
              Announcement Details
            </h3>
            
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Math Quiz Tomorrow"
                required
                data-testid="input-announcement-title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Message *</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Write your announcement message here..."
                rows={4}
                required
                data-testid="textarea-announcement-content"
                className="mt-1 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="general">
                  <SelectTrigger data-testid="select-announcement-category" className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center">
                          <i className={`${category.icon} mr-2`}></i>
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="normal">
                  <SelectTrigger data-testid="select-announcement-priority" className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center">
                          <i className={`${priority.icon} mr-2 ${priority.color}`}></i>
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <i className="fas fa-clock text-purple-500"></i>
              Scheduling (Optional)
            </h3>
            
            <div>
              <Label htmlFor="scheduledFor">Schedule for later</Label>
              <Input
                id="scheduledFor"
                name="scheduledFor"
                type="datetime-local"
                data-testid="input-announcement-schedule"
                className="mt-1"
              />
              <p className="text-sm text-gray-600 mt-1">
                Leave empty to post immediately
              </p>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">Announcement Preview</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• All students in your classroom will see this announcement</li>
                  <li>• Students can mark announcements as read to track engagement</li>
                  <li>• Higher priority announcements appear at the top</li>
                  <li>• You can edit or delete announcements after posting</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              data-testid="button-cancel-announcement"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              data-testid="button-create-announcement"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <i className="fas fa-paper-plane"></i>
                  Post Announcement
                </div>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}