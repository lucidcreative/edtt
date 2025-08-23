import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetValue: number;
  tokenReward: number;
  category: string;
}

interface ClassroomChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetValue: number;
  tokenReward: number;
  classroomId: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export default function ChallengeManagement({ classroomId }: { classroomId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ClassroomChallenge | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'fas fa-target',
    color: '#10b981',
    targetValue: 10,
    tokenReward: 25,
    expiresAt: ''
  });

  // Get classroom challenges
  const { data: challenges = [] } = useQuery({
    queryKey: [`/api/classrooms/${classroomId}/challenges`],
    enabled: !!classroomId
  });

  // Predefined challenge templates
  const templates: ChallengeTemplate[] = [
    // Academic Challenges
    { id: 'perfect-week', name: 'Perfect Week', description: 'Score 100% on 5 assignments in a row', icon: 'fas fa-star', color: '#f59e0b', targetValue: 5, tokenReward: 100, category: 'academic' },
    { id: 'reading-marathon', name: 'Reading Marathon', description: 'Read 10 books this month', icon: 'fas fa-book', color: '#06b6d4', targetValue: 10, tokenReward: 150, category: 'academic' },
    { id: 'math-master', name: 'Math Master', description: 'Complete 25 math problems correctly', icon: 'fas fa-calculator', color: '#8b5cf6', targetValue: 25, tokenReward: 75, category: 'academic' },
    { id: 'homework-hero', name: 'Homework Hero', description: 'Submit 20 assignments on time', icon: 'fas fa-pencil-alt', color: '#10b981', targetValue: 20, tokenReward: 80, category: 'academic' },
    { id: 'science-explorer', name: 'Science Explorer', description: 'Complete 8 science experiments', icon: 'fas fa-flask', color: '#f97316', targetValue: 8, tokenReward: 120, category: 'academic' },
    
    // Behavior & Character Challenges
    { id: 'kindness-champion', name: 'Kindness Champion', description: 'Perform 15 acts of kindness', icon: 'fas fa-heart', color: '#ef4444', targetValue: 15, tokenReward: 90, category: 'behavior' },
    { id: 'helping-hands', name: 'Helping Hands', description: 'Help classmates 20 times', icon: 'fas fa-hands-helping', color: '#10b981', targetValue: 20, tokenReward: 85, category: 'behavior' },
    { id: 'respect-warrior', name: 'Respect Warrior', description: 'Show respect in 30 interactions', icon: 'fas fa-handshake', color: '#3b82f6', targetValue: 30, tokenReward: 95, category: 'behavior' },
    
    // Participation Challenges
    { id: 'question-master', name: 'Question Master', description: 'Ask 25 thoughtful questions', icon: 'fas fa-question-circle', color: '#84cc16', targetValue: 25, tokenReward: 70, category: 'participation' },
    { id: 'discussion-leader', name: 'Discussion Leader', description: 'Lead 10 class discussions', icon: 'fas fa-comments', color: '#06b6d4', targetValue: 10, tokenReward: 110, category: 'participation' },
    { id: 'presentation-pro', name: 'Presentation Pro', description: 'Give 5 excellent presentations', icon: 'fas fa-chalkboard-teacher', color: '#f59e0b', targetValue: 5, tokenReward: 125, category: 'participation' },
    
    // Creativity Challenges
    { id: 'creative-genius', name: 'Creative Genius', description: 'Complete 12 creative projects', icon: 'fas fa-palette', color: '#f97316', targetValue: 12, tokenReward: 100, category: 'creativity' },
    { id: 'innovation-expert', name: 'Innovation Expert', description: 'Propose 8 innovative solutions', icon: 'fas fa-lightbulb', color: '#8b5cf6', targetValue: 8, tokenReward: 130, category: 'creativity' },
    { id: 'art-master', name: 'Art Master', description: 'Create 15 artistic pieces', icon: 'fas fa-paint-brush', color: '#ef4444', targetValue: 15, tokenReward: 85, category: 'creativity' },
    
    // Collaboration Challenges
    { id: 'team-builder', name: 'Team Builder', description: 'Successfully complete 10 group projects', icon: 'fas fa-users', color: '#10b981', targetValue: 10, tokenReward: 90, category: 'collaboration' },
    { id: 'peer-mentor', name: 'Peer Mentor', description: 'Mentor 5 struggling classmates', icon: 'fas fa-user-friends', color: '#3b82f6', targetValue: 5, tokenReward: 140, category: 'collaboration' },
    
    // Attendance & Punctuality Challenges
    { id: 'attendance-ace', name: 'Attendance Ace', description: 'Perfect attendance for 30 days', icon: 'fas fa-calendar-check', color: '#10b981', targetValue: 30, tokenReward: 150, category: 'attendance' },
    { id: 'punctuality-pro', name: 'Punctuality Pro', description: 'Arrive on time for 25 days', icon: 'fas fa-clock', color: '#f59e0b', targetValue: 25, tokenReward: 75, category: 'attendance' },
    
    // Special Achievement Challenges
    { id: 'goal-crusher', name: 'Goal Crusher', description: 'Achieve 10 personal learning goals', icon: 'fas fa-target', color: '#8b5cf6', targetValue: 10, tokenReward: 120, category: 'achievement' },
    { id: 'improvement-star', name: 'Improvement Star', description: 'Show improvement in 8 areas', icon: 'fas fa-chart-line', color: '#06b6d4', targetValue: 8, tokenReward: 110, category: 'achievement' }
  ];

  // Create challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/classrooms/${classroomId}/challenges`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Challenge Created", description: "New challenge has been added to your classroom." });
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/challenges`] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    }
  });

  // Update challenge mutation
  const updateChallengeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/challenges/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Challenge Updated", description: "Challenge has been successfully updated." });
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/challenges`] });
      setIsEditDialogOpen(false);
      setSelectedChallenge(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'fas fa-target',
      color: '#10b981',
      targetValue: 10,
      tokenReward: 25,
      expiresAt: ''
    });
    setSelectedTemplate('');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t: ChallengeTemplate) => t.id === templateId);
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        targetValue: template.targetValue,
        tokenReward: template.tokenReward,
        expiresAt: ''
      });
      setSelectedTemplate(templateId);
    }
  };

  const handleEdit = (challenge: ClassroomChallenge) => {
    setSelectedChallenge(challenge);
    setFormData({
      name: challenge.name,
      description: challenge.description || '',
      icon: challenge.icon,
      color: challenge.color,
      targetValue: challenge.targetValue,
      tokenReward: challenge.tokenReward,
      expiresAt: challenge.expiresAt ? new Date(challenge.expiresAt).toISOString().split('T')[0] : ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
    };
    
    if (selectedChallenge) {
      updateChallengeMutation.mutate({ id: selectedChallenge.id, data: submitData });
    } else {
      createChallengeMutation.mutate(submitData);
    }
  };

  const iconOptions = [
    { value: 'fas fa-target', label: '🎯 Target' },
    { value: 'fas fa-book', label: '📚 Book' },
    { value: 'fas fa-pencil-alt', label: '✏️ Pencil' },
    { value: 'fas fa-calculator', label: '🧮 Calculator' },
    { value: 'fas fa-flask', label: '🧪 Flask' },
    { value: 'fas fa-star', label: '⭐ Star' },
    { value: 'fas fa-heart', label: '❤️ Heart' },
    { value: 'fas fa-hands-helping', label: '🤝 Helping Hands' },
    { value: 'fas fa-handshake', label: '🤝 Handshake' },
    { value: 'fas fa-question-circle', label: '❓ Question' },
    { value: 'fas fa-comments', label: '💬 Comments' },
    { value: 'fas fa-chalkboard-teacher', label: '👨‍🏫 Teacher' },
    { value: 'fas fa-palette', label: '🎨 Palette' },
    { value: 'fas fa-lightbulb', label: '💡 Lightbulb' },
    { value: 'fas fa-paint-brush', label: '🖌️ Paint Brush' },
    { value: 'fas fa-users', label: '👥 Users' },
    { value: 'fas fa-user-friends', label: '👫 Friends' },
    { value: 'fas fa-calendar-check', label: '📅 Calendar Check' },
    { value: 'fas fa-clock', label: '🕐 Clock' },
    { value: 'fas fa-chart-line', label: '📈 Chart Line' }
  ];

  const colorOptions = [
    { value: '#10b981', label: 'Green' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#f59e0b', label: 'Gold' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#84cc16', label: 'Lime' },
    { value: '#f97316', label: 'Orange' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Class Challenges
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-green-500 hover:bg-green-600">
                <Plus className="h-4 w-4" />
                Add Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Template Selection */}
                <div>
                  <Label>Choose Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template or create custom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Custom Challenge</SelectItem>
                      {templates.map((template: ChallengeTemplate) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <i className={template.icon} style={{ color: template.color }}></i>
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Challenge Form */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Challenge Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter challenge name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What should students accomplish?"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="icon">Icon</Label>
                      <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: option.value }}></div>
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="targetValue">Target Value</Label>
                      <Input
                        id="targetValue"
                        type="number"
                        min="1"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tokenReward">Token Reward</Label>
                      <Input
                        id="tokenReward"
                        type="number"
                        min="0"
                        value={formData.tokenReward}
                        onChange={(e) => setFormData({ ...formData, tokenReward: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="expiresAt">Expires On (Optional)</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <Label className="text-sm text-gray-600">Preview:</Label>
                  <div className="mt-2 p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: formData.color + '20', color: formData.color }}>
                          <i className={formData.icon + ' text-sm'}></i>
                        </div>
                        <h4 className="font-medium text-sm">{formData.name || 'Challenge Name'}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{formData.description || 'Description'}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      3/{formData.targetValue} completed • {formData.tokenReward} tokens
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={createChallengeMutation.isPending || !formData.name}
                  className="w-full"
                >
                  {createChallengeMutation.isPending ? "Creating..." : "Create Challenge"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {challenges.length > 0 ? (
          <div className="space-y-3">
            {challenges.map((challenge: ClassroomChallenge, index: number) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: challenge.color + '20', color: challenge.color }}>
                        <i className={challenge.icon}></i>
                      </div>
                      <h4 className="font-medium">{challenge.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={challenge.isActive ? "default" : "secondary"}>
                        {challenge.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(challenge)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((3 / challenge.targetValue) * 100, 100)}%`,
                        backgroundColor: challenge.color 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>3/{challenge.targetValue} completed</span>
                    <span>{challenge.tokenReward} tokens</span>
                  </div>
                  {challenge.expiresAt && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      Expires: {new Date(challenge.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No challenges created yet</p>
            <p className="text-sm">Create your first challenge to engage students</p>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Challenge Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 1 })}
                />
              </div>
              
              <div>
                <Label>Token Reward</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.tokenReward}
                  onChange={(e) => setFormData({ ...formData, tokenReward: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={updateChallengeMutation.isPending || !formData.name}
              className="w-full"
            >
              {updateChallengeMutation.isPending ? "Updating..." : "Update Challenge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}