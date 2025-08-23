import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showTeacherSignup, setShowTeacherSignup] = useState(false);

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await apiRequest('POST', '/api/auth/login/teacher', {
        email,
        password
      });

      const data = await response.json();
      setAuthToken(data.token);
      
      // Invalidate auth query to refetch user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Welcome back!",
        description: `Hello ${data.user.firstName}!`,
      });

      setLocation('/');
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const username = formData.get('username') as string;
    const pin = formData.get('pin') as string;

    try {
      const response = await apiRequest('POST', '/api/auth/login/student', {
        username,
        pin
      });

      const data = await response.json();
      
      // Check if this is first login and PIN needs to be changed
      if (data.requiresPinChange) {
        // Handle PIN change flow
        setAuthToken(data.token);
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation('/change-pin');
        return;
      }
      
      setAuthToken(data.token);
      
      // Invalidate auth query to refetch user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Welcome back!",
        description: `Hello ${data.user.name || data.user.username}!`,
      });

      setLocation('/');
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or PIN",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    try {
      await apiRequest('POST', '/api/auth/register/teacher', {
        email,
        password,
        firstName,
        lastName
      });
      
      toast({
        title: "Account created!",
        description: "Your teacher account has been created. You can now sign in.",
      });

      setShowTeacherSignup(false);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDemoLogin = async (role: 'teacher' | 'student') => {
    setIsLoading(true);

    try {
      if (role === 'teacher') {
        const response = await apiRequest('POST', '/api/auth/login/teacher', {
          email: 'demo@teacher.com',
          password: 'demo123'
        });
        
        const data = await response.json();
        setAuthToken(data.token);
        
        // Invalidate auth query to refetch user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        toast({
          title: "Demo Login Successful!",
          description: "Welcome to the BizCoin demo as a teacher!",
        });
      } else {
        const response = await apiRequest('POST', '/api/auth/login/student', {
          nickname: 'DemoStudent',
          pin: '1234',
          classroomCode: 'DEMO01'
        });
        
        const data = await response.json();
        setAuthToken(data.token);
        
        // Invalidate auth query to refetch user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        toast({
          title: "Demo Login Successful!",
          description: "Welcome to the BizCoin demo as a student!",
        });
      }

      setLocation('/');
    } catch (error) {
      toast({
        title: "Demo login failed",
        description: "Demo accounts may not be available right now. Please try creating a regular account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove student join function - students are now pre-registered by teachers

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <i className="fas fa-coins text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">BizCoin</h1>
          <p className="text-gray-600">Classroom Token Economy Platform</p>
        </div>

        {/* Main Auth Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="pb-4">
            <Tabs defaultValue="teacher" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="teacher" data-testid="tab-teacher" className="text-sm">
                  <i className="fas fa-chalkboard-teacher mr-2"></i>
                  Teacher
                </TabsTrigger>
                <TabsTrigger value="student" data-testid="tab-student" className="text-sm">
                  <i className="fas fa-user-graduate mr-2"></i>
                  Student
                </TabsTrigger>
              </TabsList>

              {/* Teacher Tab */}
              <TabsContent value="teacher" className="space-y-6">
                {!showTeacherSignup ? (
                  <>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-800">Teacher Login</h2>
                    </div>
                    
                    <form onSubmit={handleTeacherLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="teacher-email">Email</Label>
                        <Input
                          id="teacher-email"
                          name="email"
                          type="email"
                          placeholder="teacher@school.edu"
                          required
                          data-testid="input-teacher-email"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="teacher-password">Password</Label>
                        <Input
                          id="teacher-password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          data-testid="input-teacher-password"
                          className="mt-1"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                        data-testid="button-teacher-login"
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>

                    <div className="space-y-3">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowTeacherSignup(true)}
                        data-testid="button-create-teacher-account"
                      >
                        Create Teacher Account
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        onClick={() => handleDemoLogin('teacher')}
                        disabled={isLoading}
                        data-testid="button-demo-teacher"
                      >
                        🚀 Try Demo as Teacher
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-800">Create Teacher Account</h2>
                    </div>
                    
                    <form onSubmit={handleTeacherSignup} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-first-name">First Name</Label>
                          <Input
                            id="signup-first-name"
                            name="firstName"
                            placeholder="John"
                            required
                            data-testid="input-signup-first-name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="signup-last-name">Last Name</Label>
                          <Input
                            id="signup-last-name"
                            name="lastName"
                            placeholder="Doe"
                            required
                            data-testid="input-signup-last-name"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="teacher@example.com"
                          required
                          data-testid="input-signup-email"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          minLength={6}
                          required
                          data-testid="input-signup-password"
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowTeacherSignup(false)}
                          data-testid="button-signup-cancel"
                        >
                          Back to Login
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={isRegistering}
                          data-testid="button-signup-submit"
                        >
                          {isRegistering ? "Creating..." : "Create Account"}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </TabsContent>

              {/* Student Tab - Simplified Design */}
              <TabsContent value="student" className="space-y-6">
                <div className="space-y-6">
                  {/* Student Login Section */}
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                        <i className="fas fa-sign-in-alt text-purple-600"></i>
                        Returning Student
                      </h2>
                      <p className="text-sm text-gray-600">Already have an account? Sign in here</p>
                    </div>
                    
                    <form onSubmit={handleStudentLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="student-classroom-code">Classroom Code</Label>
                        <Input
                          id="student-classroom-code"
                          name="classroomCode"
                          placeholder="ABC123"
                          maxLength={6}
                          required
                          data-testid="input-student-classroom-code"
                          className="mt-1 text-center text-lg font-mono uppercase"
                          onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="student-nickname">Nickname</Label>
                        <Input
                          id="student-nickname"
                          name="nickname"
                          placeholder="Your nickname"
                          required
                          data-testid="input-student-nickname"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="student-pin">PIN</Label>
                        <Input
                          id="student-pin"
                          name="pin"
                          type="password"
                          placeholder="••••"
                          maxLength={4}
                          pattern="[0-9]*"
                          required
                          data-testid="input-student-pin"
                          className="mt-1 text-center text-lg"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={isLoading}
                        data-testid="button-student-login"
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <i className="fas fa-info-circle mr-2"></i>
                      <strong>New Student?</strong> Your teacher will provide your username and temporary PIN.
                    </p>
                  </div>

                  {/* Demo Button */}
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      onClick={() => handleDemoLogin('student')}
                      disabled={isLoading}
                      data-testid="button-demo-student"
                    >
                      🚀 Try Demo as Student
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </motion.div>
    </div>
  );
}