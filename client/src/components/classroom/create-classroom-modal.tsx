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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CreateClassroomModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

const gradeOptions = [
  { value: "K", label: "Kindergarten" },
  { value: "1", label: "1st Grade" },
  { value: "2", label: "2nd Grade" },
  { value: "3", label: "3rd Grade" },
  { value: "4", label: "4th Grade" },
  { value: "5", label: "5th Grade" },
  { value: "6", label: "6th Grade" },
  { value: "7", label: "7th Grade" },
  { value: "8", label: "8th Grade" },
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade" },
  { value: "12", label: "12th Grade" },
];

const subjectOptions = [
  { value: "Mathematics", label: "Mathematics" },
  { value: "Science", label: "Science" },
  { value: "English Language Arts", label: "English Language Arts" },
  { value: "Social Studies", label: "Social Studies" },
  { value: "History", label: "History" },
  { value: "Art", label: "Art" },
  { value: "Music", label: "Music" },
  { value: "Physical Education", label: "Physical Education" },
  { value: "Computer Science", label: "Computer Science" },
  { value: "Foreign Language", label: "Foreign Language" },
  { value: "Other", label: "Other" },
];

const currentYear = new Date().getFullYear();
const academicYearOptions = [
  { value: `${currentYear}-${currentYear + 1}`, label: `${currentYear}-${currentYear + 1}` },
  { value: `${currentYear - 1}-${currentYear}`, label: `${currentYear - 1}-${currentYear}` },
  { value: `${currentYear + 1}-${currentYear + 2}`, label: `${currentYear + 1}-${currentYear + 2}` },
];

export default function CreateClassroomModal({ children, onSuccess }: CreateClassroomModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createClassroomMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/classrooms/enhanced', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Classroom Created!",
        description: `${data.name} has been created successfully.`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create classroom",
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
    const data = {
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      gradeLevel: formData.get('gradeLevel') as string,
      academicYear: formData.get('academicYear') as string,
      description: formData.get('description') as string,
      autoApproveStudents: formData.get('autoApproveStudents') === 'on',
    };

    createClassroomMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-chalkboard text-white text-sm"></i>
            </div>
            Create New Classroom
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
              <i className="fas fa-info-circle text-blue-500"></i>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Classroom Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Ms. Johnson's Math Class"
                  required
                  data-testid="input-classroom-name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select name="subject" required>
                  <SelectTrigger data-testid="select-classroom-subject" className="mt-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((subject) => (
                      <SelectItem key={subject.value} value={subject.value}>
                        {subject.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gradeLevel">Grade Level *</Label>
                <Select name="gradeLevel" required>
                  <SelectTrigger data-testid="select-classroom-grade" className="mt-1">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Select name="academicYear" required>
                  <SelectTrigger data-testid="select-classroom-year" className="mt-1">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of your classroom (optional)"
                rows={3}
                data-testid="textarea-classroom-description"
                className="mt-1"
              />
            </div>
          </div>

          {/* Enrollment Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <i className="fas fa-user-plus text-green-500"></i>
              Enrollment Settings
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="autoApproveStudents" className="font-medium">
                  Auto-approve new students
                </Label>
                <p className="text-sm text-gray-600">
                  Students can join immediately without waiting for approval
                </p>
              </div>
              <Switch
                id="autoApproveStudents"
                name="autoApproveStudents"
                defaultChecked={true}
                data-testid="switch-auto-approve"
              />
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-lightbulb text-blue-500 mt-0.5"></i>
              <div className="space-y-1">
                <p className="font-medium text-blue-800">Getting Started</p>
                <p className="text-sm text-blue-700">
                  After creating your classroom, you'll receive a unique join code that students can use to enroll. 
                  You can find this code in your classroom settings.
                </p>
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
              data-testid="button-cancel-classroom"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              data-testid="button-create-classroom"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <i className="fas fa-plus"></i>
                  Create Classroom
                </div>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}