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
  const [pinResetRequested, setPinResetRequested] = useState(false);
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
      const message = pinResetRequested 
        ? "Student information updated and PIN reset to 0000."
        : "Student information has been updated successfully.";
      toast({
        title: "Student Updated",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "roster"] });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      setPinResetRequested(false);
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
    setPinResetRequested(false);
    setIsEditDialogOpen(true);
  };

  const handleRemoveStudent = (studentId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to remove ${studentName} from the classroom? This action cannot be undone.`)) {
      removeStudentMutation.mutate(studentId);
    }
  };

  const handleResetPin = () => {
    setPinResetRequested(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const username = formData.get('username') as string;
    const tokens = parseInt(formData.get('tokens') as string);

    const updates: any = {
      username,
      tokens
    };

    if (pinResetRequested) {
      updates.requiresPinChange = true;
      updates.resetPin = true;
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
      <Card className="hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                {enrollment.student.name?.charAt(0)?.toUpperCase() || enrollment.student.username?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg truncate" data-testid={`student-name-${enrollment.student.id}`}>
                    {enrollment.student.name || enrollment.student.username}
                  </h3>
                  <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium px-2 py-1">
                    Active
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-user w-4 text-center text-gray-400 mr-2"></i>
                    <span className="font-medium">@{enrollment.student.username}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="fas fa-coins w-4 text-center text-yellow-500 mr-2"></i>
                      <span className="font-medium">{enrollment.student.tokens} tokens</span>
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      Joined {formatDate(enrollment.enrolledAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditStudent(enrollment.student)}
              className="p-2 h-auto text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full ml-3"
              data-testid={`button-edit-${enrollment.student.id}`}
            >
              <i className="fas fa-edit text-lg"></i>
            </Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Edit Student: {editingStudent?.name || editingStudent?.username}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update student information, manage tokens, and account settings.
            </DialogDescription>
          </DialogHeader>
          
          {editingStudent && (
            <div className="space-y-6">
              {/* Student Info Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {editingStudent.name?.charAt(0)?.toUpperCase() || editingStudent.username?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{editingStudent.name}</h4>
                    <p className="text-sm text-gray-600">@{editingStudent.username}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Current tokens:</span>
                    <span className="font-medium">{editingStudent.tokens}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-username" className="text-sm font-medium text-gray-700">
                      Username
                    </Label>
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
                    <Label htmlFor="edit-tokens" className="text-sm font-medium text-gray-700">
                      Token Balance
                    </Label>
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
                </div>
                
                {/* PIN Reset Section */}
                <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-orange-800">PIN Management</h4>
                      <p className="text-xs text-orange-700 mt-1">
                        Reset student's PIN to default (0000)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetPin}
                      disabled={editStudentMutation.isPending || pinResetRequested}
                      className={`${
                        pinResetRequested 
                          ? 'bg-orange-100 text-orange-700 border-orange-300' 
                          : 'text-orange-600 border-orange-300 hover:bg-orange-50'
                      }`}
                      data-testid="button-reset-pin"
                    >
                      <i className="fas fa-key mr-1"></i>
                      {pinResetRequested ? 'PIN will be reset' : 'Reset PIN'}
                    </Button>
                  </div>
                  {pinResetRequested && (
                    <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                      ✓ PIN will be reset to 0000 when you save changes. Student must change it on next login.
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setPinResetRequested(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700" 
                    disabled={editStudentMutation.isPending}
                  >
                    {editStudentMutation.isPending ? (
                      <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${editingStudent?.name || editingStudent?.username} from the classroom? This action cannot be undone.`)) {
                        handleRemoveStudent(editingStudent!.id, editingStudent!.name || editingStudent!.username);
                        setIsEditDialogOpen(false);
                        setPinResetRequested(false);
                      }
                    }}
                    disabled={removeStudentMutation.isPending}
                    className="px-4"
                  >
                    {removeStudentMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fas fa-trash mr-1"></i>Remove</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}