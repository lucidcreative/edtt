import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Award, Trash } from "lucide-react";
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

interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

interface ClassroomBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  classroomId: string;
  isActive: boolean;
  createdAt: string;
}

export default function BadgeManagement({ classroomId }: { classroomId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ClassroomBadge | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'fas fa-award',
    color: '#f59e0b',
    category: 'academic'
  });

  // Get classroom badges
  const { data: badges = [] } = useQuery({
    queryKey: [`/api/classrooms/${classroomId}/badges`],
    enabled: !!classroomId
  });

  // Get badge templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/badge-templates"]
  });

  // Create badge mutation
  const createBadgeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/classrooms/${classroomId}/badges`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Badge Created", description: "New badge has been added to your classroom." });
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/badges`] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    }
  });

  // Update badge mutation
  const updateBadgeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/badges/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Badge Updated", description: "Badge has been successfully updated." });
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/badges`] });
      setIsEditDialogOpen(false);
      setSelectedBadge(null);
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
      icon: 'fas fa-award',
      color: '#f59e0b',
      category: 'academic'
    });
    setSelectedTemplate('');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t: BadgeTemplate) => t.id === templateId);
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        category: template.category
      });
      setSelectedTemplate(templateId);
    }
  };

  const handleEdit = (badge: ClassroomBadge) => {
    setSelectedBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description || '',
      icon: badge.icon,
      color: badge.color,
      category: badge.category || 'academic'
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedBadge) {
      updateBadgeMutation.mutate({ id: selectedBadge.id, data: formData });
    } else {
      createBadgeMutation.mutate(formData);
    }
  };

  const iconOptions = [
    { value: 'fas fa-trophy', label: '🏆 Trophy' },
    { value: 'fas fa-star', label: '⭐ Star' },
    { value: 'fas fa-medal', label: '🏅 Medal' },
    { value: 'fas fa-award', label: '🎖️ Award' },
    { value: 'fas fa-crown', label: '👑 Crown' },
    { value: 'fas fa-gem', label: '💎 Gem' },
    { value: 'fas fa-heart', label: '❤️ Heart' },
    { value: 'fas fa-lightbulb', label: '💡 Lightbulb' },
    { value: 'fas fa-puzzle-piece', label: '🧩 Puzzle' },
    { value: 'fas fa-rocket', label: '🚀 Rocket' }
  ];

  const colorOptions = [
    { value: '#f59e0b', label: 'Gold' },
    { value: '#10b981', label: 'Green' },
    { value: '#3b82f6', label: 'Blue' },
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
            <Award className="h-5 w-5 text-yellow-500" />
            Classroom Badges
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Badge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Badge</DialogTitle>
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
                      <SelectItem value="">Custom Badge</SelectItem>
                      {templates.map((template: BadgeTemplate) => (
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

                {/* Badge Form */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Badge Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter badge name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What is this badge for?"
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
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="behavior">Behavior</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="creativity">Creativity</SelectItem>
                        <SelectItem value="collaboration">Collaboration</SelectItem>
                        <SelectItem value="participation">Participation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <Label className="text-sm text-gray-600">Preview:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: formData.color + '20', color: formData.color }}>
                      <i className={formData.icon}></i>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formData.name || 'Badge Name'}</p>
                      <p className="text-xs text-gray-500">{formData.description || 'Description'}</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={createBadgeMutation.isPending || !formData.name}
                  className="w-full"
                >
                  {createBadgeMutation.isPending ? "Creating..." : "Create Badge"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badges.map((badge: ClassroomBadge, index: number) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="border-2 border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-all">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: badge.color + '20', color: badge.color }}>
                    <i className={badge.icon + ' text-xl'}></i>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{badge.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {badge.category}
                  </Badge>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(badge)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No badges created yet</p>
            <p className="text-sm">Create your first badge to motivate students</p>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Badge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Badge Name</Label>
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
                <Label>Icon</Label>
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
                <Label>Color</Label>
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

            <Button 
              onClick={handleSubmit}
              disabled={updateBadgeMutation.isPending || !formData.name}
              className="w-full"
            >
              {updateBadgeMutation.isPending ? "Updating..." : "Update Badge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}