import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import QRCode from 'qrcode';
import { Share2, Copy, QrCode, Download, ExternalLink } from 'lucide-react';
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
  nickname: string;
  firstName?: string;
  lastName?: string;
  tokens: number;
  level: number;
  totalEarnings: number;
  profileImageUrl?: string;
  isActive: boolean;
  enrolledAt: string;
}

interface Enrollment {
  id: string;
  studentId: string;
  classroomId: string;
  enrollmentStatus: 'pending' | 'approved' | 'denied';
  enrolledAt: string;
  approvedAt?: string;
  approvedBy?: string;
  student: Student;
}

interface RosterManagementProps {
  classroomId: string;
  classroomName: string;
  joinCode: string;
}

export default function RosterManagement({ classroomId, classroomName, joinCode }: RosterManagementProps) {
  const [selectedTab, setSelectedTab] = useState("approved");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [defaultTempPin, setDefaultTempPin] = useState('123456');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate QR code for the join code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const joinUrl = `${window.location.origin}/join?code=${joinCode}`;
        const qrUrl = await QRCode.toDataURL(joinUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (joinCode) {
      generateQRCode();
    }
  }, [joinCode]);

  // Fetch classroom roster
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/classrooms", classroomId, "roster"],
    enabled: !!classroomId && user?.role === 'teacher'
  });

  // Separate enrollments by status
  const approvedStudents = (enrollments || []).filter((e: Enrollment) => e.enrollmentStatus === 'approved');
  const pendingStudents = (enrollments || []).filter((e: Enrollment) => e.enrollmentStatus === 'pending');

  // Approve enrollment mutation
  const approveEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await apiRequest('PUT', `/api/enrollments/${enrollmentId}/approve`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Approved",
        description: "Student has been approved and can now access the classroom.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "roster"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve student",
        variant: "destructive",
      });
    },
  });

  // Deny enrollment mutation
  const denyEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await apiRequest('PUT', `/api/enrollments/${enrollmentId}/deny`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Denied",
        description: "Student enrollment has been denied.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "roster"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deny student",
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
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      if (headers[0] !== 'username' || headers[1] !== 'name' || headers[2] !== 'tempPin') {
        throw new Error('Invalid CSV format. Expected columns: username,name,tempPin');
      }

      const students = lines.slice(1).map(line => {
        const [username, name, tempPin] = line.split(',').map(s => s.trim());
        return { username, name, tempPin, requiresPinChange: true };
      });

      const response = await apiRequest('POST', `/api/classrooms/${classroomId}/students/bulk`, {
        students
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to upload students' }));
        throw new Error(errorData.message || 'Failed to upload students');
      }

      toast({
        title: "Students Added",
        description: `Successfully added ${students.length} students to the classroom.`,
      });
      
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

  const copyJoinLink = async () => {
    try {
      const joinUrl = `${window.location.origin}/join?code=${joinCode}`;
      await navigator.clipboard.writeText(joinUrl);
      toast({
        title: "Copied!",
        description: "Join link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy join link",
        variant: "destructive",
      });
    }
  };

  const copyJoinLinkWithPin = async (pin: string) => {
    try {
      const joinUrl = `${window.location.origin}/join?code=${joinCode}&pin=${pin}`;
      await navigator.clipboard.writeText(joinUrl);
      toast({
        title: "Copied!",
        description: "Join link with default PIN copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy join link",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `${classroomName}-qr-code.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Downloaded!",
      description: "QR code saved to your device",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const StudentCard = ({ enrollment, showActions = false }: { enrollment: Enrollment; showActions?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {enrollment.student.nickname?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800" data-testid={`student-name-${enrollment.student.id}`}>
                    {enrollment.student.nickname}
                  </h3>
                  {getStatusBadge(enrollment.enrollmentStatus)}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-coins text-yellow-500"></i>
                    {enrollment.student.tokens} tokens
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-level-up-alt text-blue-500"></i>
                    Level {enrollment.student.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    Joined {formatDate(enrollment.enrolledAt)}
                  </span>
                </div>
              </div>
            </div>
            
            {showActions && enrollment.enrollmentStatus === 'pending' && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => denyEnrollmentMutation.mutate(enrollment.id)}
                  disabled={denyEnrollmentMutation.isPending}
                  data-testid={`button-deny-${enrollment.student.id}`}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <i className="fas fa-times mr-1"></i>
                  Deny
                </Button>
                <Button
                  size="sm"
                  onClick={() => approveEnrollmentMutation.mutate(enrollment.id)}
                  disabled={approveEnrollmentMutation.isPending}
                  data-testid={`button-approve-${enrollment.student.id}`}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <i className="fas fa-check mr-1"></i>
                  Approve
                </Button>
              </div>
            )}
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
              </DialogHeader>
              <Tabs defaultValue="individual" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="individual">Individual Student</TabsTrigger>
                  <TabsTrigger value="bulk">CSV Upload</TabsTrigger>
                  <TabsTrigger value="share">Share Classroom</TabsTrigger>
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
                        placeholder="123456"
                        maxLength={6}
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
                        student1,John Doe,123456<br/>
                        student2,Jane Smith,654321
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
                
                <TabsContent value="share" className="space-y-4">
                  <div className="space-y-6">
                    {/* Default Password Setting */}
                    <div>
                      <Label htmlFor="default-pin">Default Temporary PIN for New Students</Label>
                      <Input
                        id="default-pin"
                        value={defaultTempPin}
                        onChange={(e) => setDefaultTempPin(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        pattern="[0-9]*"
                        className="mt-1 text-center font-mono text-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Students will be prompted to change this on first login</p>
                    </div>
                    
                    {/* QR Code Section */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-3">QR Code</h3>
                      {qrCodeUrl && (
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block shadow-sm">
                          <img src={qrCodeUrl} alt="QR Code for joining classroom" className="w-40 h-40" />
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-2 mb-3">
                        Students can scan this QR code to join your classroom
                      </p>
                      <Button onClick={downloadQRCode} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Code
                      </Button>
                    </div>
                    
                    {/* Join Code Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Join Code</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          value={joinCode}
                          readOnly
                          className="text-center font-mono text-xl tracking-wider bg-gray-50"
                        />
                        <Button onClick={copyJoinCode} variant="outline" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Share this 6-character code with your students
                      </p>
                    </div>
                    
                    {/* Join Link Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Direct Link</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          value={`${window.location.origin}/join?code=${joinCode}&pin=${defaultTempPin}`}
                          readOnly
                          className="text-sm bg-gray-50"
                        />
                        <Button onClick={() => copyJoinLinkWithPin(defaultTempPin)} variant="outline" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Students can click this link to join with the default PIN
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>Tip:</strong> The direct link includes your default PIN ({defaultTempPin}) for easy student access.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="approved" className="flex items-center gap-2" data-testid="tab-approved-students">
            <i className="fas fa-check-circle text-green-500"></i>
            Approved Students ({approvedStudents.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2" data-testid="tab-pending-students">
            <i className="fas fa-clock text-yellow-500"></i>
            Pending Approval ({pendingStudents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="space-y-4">
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
          ) : approvedStudents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {approvedStudents.map((enrollment: Enrollment) => (
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
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingStudents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingStudents.map((enrollment: Enrollment) => (
                <StudentCard key={enrollment.id} enrollment={enrollment} showActions={true} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <i className="fas fa-hourglass-half text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Pending Approvals</h3>
                <p className="text-gray-600">
                  All student enrollment requests have been processed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}