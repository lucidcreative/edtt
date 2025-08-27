import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface StudentProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Available avatar styles from DiceBear
const avatarSeeds = [
  'happy', 'sunny', 'cheerful', 'bright', 'smile', 'joy', 'star', 'cool', 
  'awesome', 'magic', 'rainbow', 'spark', 'energy', 'power', 'brave', 'smart',
  'genius', 'creative', 'artistic', 'musical', 'sporty', 'friendly', 'kind', 'gentle'
];

const avatarBackgrounds = [
  'b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'ffe4e1', 'e1f5fe', 'f3e5f5'
];

export default function StudentProfileDialog({ open, onOpenChange }: StudentProfileDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('b6e3f4');

  // Get student's enrollments to show available classrooms
  const { data: enrollments = [] } = useQuery({
    queryKey: ["/api/students", user?.id, "enrollments"],
    enabled: !!user?.id && user?.role === 'student'
  });

  // Initialize avatar seed from current profile
  useEffect(() => {
    if (user?.profileImageUrl) {
      const seedMatch = user.profileImageUrl.match(/seed=([^&]+)/);
      const backgroundMatch = user.profileImageUrl.match(/backgroundColor=([^&]+)/);
      if (seedMatch) setSelectedAvatar(seedMatch[1]);
      if (backgroundMatch) setSelectedBackground(backgroundMatch[1]);
    } else {
      setSelectedAvatar(user?.nickname || 'student');
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { nickname?: string; profileImageUrl?: string }) => {
      const response = await apiRequest('PATCH', `/api/users/profile`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated!" });
      // Refresh the page to update user data
      window.location.reload();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
    }
  });

  const handleSaveProfile = () => {
    const profileImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}&backgroundColor=${selectedBackground}`;
    
    updateProfileMutation.mutate({
      nickname: nickname.trim(),
      profileImageUrl
    });
  };

  const generateAvatarUrl = (seed: string, background: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${background}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-user text-white text-sm"></i>
            </div>
            My Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Profile Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  src={generateAvatarUrl(selectedAvatar, selectedBackground)}
                  alt="Profile Preview"
                  className="w-16 h-16 rounded-full object-cover border-4 border-gray-200"
                />
                <div>
                  <p className="font-semibold text-lg text-gray-800">{nickname || 'Student'}</p>
                  <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
                  <Badge variant="outline" className="mt-1">
                    <i className="fas fa-coins mr-1 text-yellow-500"></i>
                    {user?.tokens || 0} tokens
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Name/Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Display Name</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your display name"
              className="text-lg"
              data-testid="input-nickname"
            />
            <p className="text-sm text-gray-500">This is how other students and teachers will see your name.</p>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-4">
            <Label>Choose Your Avatar</Label>
            
            {/* Avatar Styles */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Avatar Style:</p>
              <div className="grid grid-cols-6 gap-2">
                {avatarSeeds.map((seed) => (
                  <motion.button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedAvatar(seed)}
                    className={`relative rounded-full p-1 transition-all duration-200 ${
                      selectedAvatar === seed ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={generateAvatarUrl(seed, selectedBackground)}
                      alt={seed}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Background Colors */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Background Color:</p>
              <div className="flex gap-2 flex-wrap">
                {avatarBackgrounds.map((bg) => (
                  <motion.button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedBackground(bg)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      selectedBackground === bg ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-300'
                    }`}
                    style={{ backgroundColor: `#${bg}` }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Enrolled Classrooms */}
          {enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Classrooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(enrollments as any[]).map((enrollment: any) => (
                    <div
                      key={enrollment.classroomId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{enrollment.classroom?.name}</p>
                        <p className="text-sm text-gray-600">{enrollment.classroom?.description}</p>
                      </div>
                      <Badge 
                        variant={enrollment.enrollmentStatus === 'approved' ? 'default' : 'secondary'}
                        className={enrollment.enrollmentStatus === 'approved' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {enrollment.enrollmentStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending || !nickname.trim()}
              className="flex-1"
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-profile"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}