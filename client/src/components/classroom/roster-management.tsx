import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Copy } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Student {
  id: string;
  username: string;
  name: string;
  tokens: number;
  totalEarnings: number;
  profileImageUrl?: string;
  isActive: boolean;
  enrolledAt: string;
}

interface Enrollment {
  id: string;
  studentId: string;
  classroomId: string;
  enrollmentStatus: 'approved';
  enrolledAt: string;
  student: Student;
}

interface RosterManagementProps {
  classroomId: string;
  classroomName: string;
  joinCode: string;
}

export default function RosterManagement({ classroomId, classroomName, joinCode }: RosterManagementProps) {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch classroom roster
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/classrooms", classroomId, "roster"],
    enabled: !!classroomId && user?.role === 'teacher'
  });

  // All students are automatically approved
  const students = (enrollments || []);

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await apiRequest('DELETE', `/api/classrooms/${classroomId}/students/${studentId}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to remove student' }));
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Removed",
        description: "Student has been removed from the classroom.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "roster"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove student",
        variant: "destructive",
      });
    },
  });

  // Edit student mutation
  const editStudentMutation = useMutation({
    mutationFn: async ({ studentId, updates }: { studentId: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/students/${studentId}`, updates);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update student' }));
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Updated",
        description: "Student information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "roster"] });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    },
  });

  // Add individual student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingStudent(true);
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const username = formData.get('username') as string;
    const name = formData.get('name') as string;
    const tempPin = formData.get('tempPin') as string;

    try {
      const response = await apiRequest('POST', `/api/classrooms/${classroomId}/students`, {
        username,
        name,
        tempPin,
        requiresPinChange: true
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add student' }));
        throw new Error(errorData.message || 'Failed to add student');
      }

      toast({
        title: "Student Added",
        description: `${name} has been added to the classroom.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "roster"] });
      setIsAddStudentOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        title: "Failed to add student",
        description: error.message || "Unable to add student",
        variant: "destructive",
      });
    } finally {
      setIsAddingStudent(false);
    }
  };

  // Handle CSV upload
  const handleCSVUpload = async () => {
    const fileInput = document.getElementById('csv-file') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingCSV(true);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      
      if (headers.length < 3 || headers[0] !== 'username' || headers[1] !== 'name' || headers[2] !== 'tempPin') {
        throw new Error('Invalid CSV format. Expected columns: username,name,tempPin');
      }

      const studentsData = [];
      const errors = [];
      const seenUsernames = new Set();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',').map(s => s.trim());
        
        if (columns.length < 3) {
          errors.push(`Row ${i + 1}: Missing required columns`);
          continue;
        }

        const [username, name, tempPin] = columns;
        
        if (!username || !name || !tempPin) {
          errors.push(`Row ${i + 1}: Missing required fields (username, name, or tempPin)`);
          continue;
        }

        if (!/^\d{4}$/.test(tempPin)) {
          errors.push(`Row ${i + 1}: PIN must be exactly 4 digits`);
          continue;
        }

        if (seenUsernames.has(username.toLowerCase())) {
          errors.push(`Row ${i + 1}: Duplicate username '${username}'`);
          continue;
        }
        
        seenUsernames.add(username.toLowerCase());
        studentsData.push({ username, name, tempPin, requiresPinChange: true });
      }

      if (studentsData.length === 0) {
        throw new Error(`No valid students found. Errors:\n${errors.join('\n')}`);
      }

      const response = await apiRequest('POST', `/api/classrooms/${classroomId}/students/bulk`, {
        students: studentsData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload students' }));
        throw new Error(errorData.message || 'Failed to upload students');
      }

      let successMessage = `Successfully added ${studentsData.length} students to the classroom.`;
      if (errors.length > 0) {
        successMessage += ` ${errors.length} rows had errors and were skipped.`;
      }

      toast({
        title: "Students Added",
        description: successMessage,
      });
      
      if (errors.length > 0) {
        console.warn('CSV Upload Errors:', errors);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "roster"] });
      setIsAddStudentOpen(false);
      fileInput.value = '';
    } catch (error: any) {
      toast({
        title: "Failed to upload CSV",
        description: error.message || "Unable to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      toast({
        title: "Copied!",
        description: "Join code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy join code",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleRemoveStudent = (studentId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to remove ${studentName} from the classroom? This action cannot be undone.`)) {
      removeStudentMutation.mutate(studentId);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const username = formData.get('username') as string;
    const tokens = parseInt(formData.get('tokens') as string);
    const resetPin = formData.get('resetPin') === 'on';

    const updates: any = {
      username,
      tokens
    };

    if (resetPin) {
      updates.requiresPinChange = true;
    }

    editStudentMutation.mutate({
      studentId: editingStudent.id,
      updates
    });
  };

  const StudentCard = ({ enrollment }: { enrollment: Enrollment }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={() => handleEditStudent(enrollment.student)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {enrollment.student.name?.charAt(0)?.toUpperCase() || enrollment.student.username?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800" data-testid={`student-name-${enrollment.student.id}`}>
                    {enrollment.student.name || enrollment.student.username}
                  </h3>
                  <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-user text-gray-500"></i>
                    @{enrollment.student.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-coins text-yellow-500"></i>
                    {enrollment.student.tokens} tokens
                  </span>
                  <span className="text-xs text-gray-500">
                    Joined {formatDate(enrollment.enrolledAt)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveStudent(enrollment.student.id, enrollment.student.name || enrollment.student.username);
                }}
                disabled={removeStudentMutation.isPending}
                data-testid={`button-remove-${enrollment.student.id}`}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <i className="fas fa-trash mr-1"></i>
                Remove
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (user?.role !== 'teacher') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Only teachers can manage classroom rosters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Classroom Roster</h2>
          <p className="text-gray-600">{classroomName}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <p className="text-sm text-blue-800">
              <strong>Join Code:</strong> <code className="bg-blue-100 px-2 py-1 rounded font-mono">{joinCode}</code>
            </p>
          </div>
          
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" data-testid="button-add-student">
                <i className="fas fa-user-plus mr-2"></i>
                Add Students
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Students to Classroom</DialogTitle>
                <DialogDescription>
                  Add students individually or upload a CSV file to enroll multiple students at once.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="individual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="individual">Individual Student</TabsTrigger>
                  <TabsTrigger value="bulk">CSV Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="individual" className="space-y-4">
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                      <Label htmlFor="student-username">Username</Label>
                      <Input
                        id="student-username"
                        name="username"
                        placeholder="student123"
                        required
                        data-testid="input-student-username"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="student-name">Full Name</Label>
                      <Input
                        id="student-name"
                        name="name"
                        placeholder="John Doe"
                        required
                        data-testid="input-student-name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="temp-pin">Temporary PIN</Label>
                      <Input
                        id="temp-pin"
                        name="tempPin"
                        type="password"
                        placeholder="1234"
                        maxLength={4}
                        pattern="[0-9]*"
                        required
                        data-testid="input-temp-pin"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Student will change this on first login</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddStudentOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isAddingStudent}>
                        {isAddingStudent ? "Adding..." : "Add Student"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="bulk" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csv-file">CSV File</Label>
                      <Input
                        id="csv-file"
                        name="csvFile"
                        type="file"
                        accept=".csv"
                        className="mt-1"
                        data-testid="input-csv-file"
                      />
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-2">
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>CSV Format:</strong>
                      </p>
                      <code className="text-xs bg-white px-2 py-1 rounded block">
                        username,name,tempPin<br/>
                        student1,John Doe,1234<br/>
                        student2,Jane Smith,5678
                      </code>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddStudentOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCSVUpload} className="flex-1" disabled={isUploadingCSV}>
                        {isUploadingCSV ? "Uploading..." : "Upload Students"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Students ({students.length})
          </h3>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : students.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {students.map((enrollment: Enrollment) => (
              <StudentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Students Yet</h3>
              <p className="text-gray-600 mb-4">
                Share your classroom join code to get students enrolled.
              </p>
              <Button 
                onClick={() => setIsAddStudentOpen(true)}
                variant="outline"
                data-testid="button-share-join-code"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Add Students
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  name="username"
                  defaultValue={editingStudent.username}
                  required
                  data-testid="input-edit-username"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-tokens">Token Balance</Label>
                <Input
                  id="edit-tokens"
                  name="tokens"
                  type="number"
                  min="0"
                  defaultValue={editingStudent.tokens}
                  required
                  data-testid="input-edit-tokens"
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reset-pin"
                  name="resetPin"
                  className="rounded"
                  data-testid="checkbox-reset-pin"
                />
                <Label htmlFor="reset-pin" className="text-sm">
                  Reset PIN (student will be required to set a new PIN on next login)
                </Label>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={editStudentMutation.isPending}
                >
                  {editStudentMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}