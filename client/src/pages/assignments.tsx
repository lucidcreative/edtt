import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

const categories = [
  { value: "math", label: "Math", icon: "fas fa-calculator", color: "bg-red-100 text-red-600" },
  { value: "science", label: "Science", icon: "fas fa-flask", color: "bg-blue-100 text-blue-600" },
  { value: "history", label: "History", icon: "fas fa-landmark", color: "bg-green-100 text-green-600" },
  { value: "english", label: "English", icon: "fas fa-book", color: "bg-purple-100 text-purple-600" },
  { value: "art", label: "Art", icon: "fas fa-palette", color: "bg-pink-100 text-pink-600" },
];

export default function Assignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', tokenReward: 0, dueDate: '' });

  // Get user's classrooms
  const { data: classrooms } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  const currentClassroom = classrooms?.[0];

  // Get assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "assignments"],
    enabled: !!currentClassroom
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      const response = await apiRequest('POST', '/api/assignments', { ...assignmentData, teacherId: user?.id });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", currentClassroom?.id, "assignments"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Assignment Created",
        description: "The assignment has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assignment",
        variant: "destructive",
      });
    }
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/assignments/${data.assignmentId}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", currentClassroom?.id, "assignments"] });
      setIsDetailDialogOpen(false);
      setIsEditing(false);
      toast({
        title: "Assignment Updated",
        description: "The assignment has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assignment",
        variant: "destructive",
      });
    }
  });

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const assignmentData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      tokenReward: parseInt(formData.get('tokenReward') as string) || 0,
      classroomId: currentClassroom?.id,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null
    };

    createAssignmentMutation.mutate(assignmentData);
  };

  const handleAssignmentClick = (assignment: any) => {
    setSelectedAssignment(assignment);
    setEditForm({
      title: assignment.title || '',
      description: assignment.description || '',
      category: assignment.category || '',
      tokenReward: assignment.tokenReward || 0,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : ''
    });
    setIsEditing(false);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateAssignment = () => {
    if (!selectedAssignment) return;
    updateAssignmentMutation.mutate({
      assignmentId: selectedAssignment.id,
      updates: {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        tokenReward: editForm.tokenReward,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate) : null
      }
    });
  };

  const filteredAssignments = assignments?.filter((assignment: any) => 
    selectedCategory === "all" || assignment.category === selectedCategory
  ) || [];

  // Get only categories that exist in current assignments
  const availableCategories = categories.filter(category => 
    assignments?.some((assignment: any) => assignment.category === category.value)
  );

  if (!currentClassroom) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <i className="fas fa-tasks text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Classroom Found</h3>
          <p className="text-gray-600">Create a classroom to manage assignments.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-gray-600">{currentClassroom.name} • {filteredAssignments.length} assignments</p>
        </div>
        
        {user?.role === 'teacher' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-assignment">
                <i className="fas fa-plus mr-2"></i>
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Assignment title"
                    required
                    data-testid="input-assignment-title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Assignment description"
                    rows={3}
                    data-testid="textarea-assignment-description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger data-testid="select-assignment-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
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
                  <Label htmlFor="tokenReward">Token Reward</Label>
                  <Input
                    id="tokenReward"
                    name="tokenReward"
                    type="number"
                    min="0"
                    placeholder="0"
                    data-testid="input-token-reward"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="datetime-local"
                    data-testid="input-due-date"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1" disabled={createAssignmentMutation.isPending}>
                    {createAssignmentMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Filter - Only show when there are assignments */}
      {(assignments && assignments.length > 0) && (
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            data-testid="filter-all"
          >
            All
          </Button>
          {availableCategories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              data-testid={`filter-${category.value}`}
              className="whitespace-nowrap"
            >
              <i className={`${category.icon} mr-2`}></i>
              {category.label}
            </Button>
          ))}
        </div>
      )}

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-clipboard-list text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {selectedCategory === "all" ? "No Assignments Yet" : `No ${categories.find(c => c.value === selectedCategory)?.label} Assignments`}
          </h3>
          <p className="text-gray-600">
            {user?.role === 'teacher' 
              ? "Create your first assignment to get started."
              : "Check back later for new assignments!"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment: any, index: number) => {
            const category = categories.find(c => c.value === assignment.category);
            const categoryGradient = category?.value === 'math' 
              ? 'from-red-500 to-red-600'
              : category?.value === 'science'
              ? 'from-blue-500 to-blue-600'
              : category?.value === 'history'
              ? 'from-green-500 to-green-600'
              : category?.value === 'english'
              ? 'from-purple-500 to-purple-600'
              : category?.value === 'art'
              ? 'from-pink-500 to-pink-600'
              : 'from-gray-500 to-gray-600';
              
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden bg-gradient-to-r ${categoryGradient} text-white cursor-pointer hover:scale-105`}
                data-testid={`assignment-card-${index}`}
                onClick={() => handleAssignmentClick(assignment)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {category && (
                        <i className={`${category.icon} text-3xl`}></i>
                      )}
                      <h3 className="text-xl font-bold" data-testid={`assignment-title-${index}`}>
                        {assignment.title}
                      </h3>
                    </div>
                    
                    {assignment.tokenReward > 0 && (
                      <div className="text-right">
                        <div className="text-2xl font-bold" data-testid={`assignment-reward-${index}`}>
                          {assignment.tokenReward}
                        </div>
                        <div className="text-sm text-white/80">tokens</div>
                      </div>
                    )}
                  </div>
                  
                  {assignment.description && (
                    <p className="text-white/90 text-sm mb-4" data-testid={`assignment-description-${index}`}>
                      {assignment.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    {assignment.dueDate ? (
                      <span className="text-white/80 text-sm" data-testid={`assignment-due-date-${index}`}>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-white/80 text-sm">No due date</span>
                    )}
                    
                    <span className="text-white/80 text-sm" data-testid={`assignment-created-${index}`}>
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {category && (
                      <Badge variant="outline" className="text-white border-white/50" data-testid={`assignment-category-${index}`}>
                        {category.label}
                      </Badge>
                    )}
                    
                    {user?.role === 'student' ? (
                      <Button size="sm" variant="secondary" data-testid={`button-submit-${index}`} onClick={(e) => e.stopPropagation()}>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Submit
                      </Button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAssignmentClick(assignment); }}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        data-testid={`button-edit-${index}`}
                      >
                        <i className="fas fa-edit text-white"></i>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Assignment Detail/Edit Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-tasks text-white text-sm"></i>
              </div>
              {isEditing ? 'Edit Assignment' : 'Assignment Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-6">
              {!isEditing ? (
                // View Mode
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedAssignment.title}</h2>
                    <div className="flex items-center gap-4 mb-4">
                      {categories.find(c => c.value === selectedAssignment.category) && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <i className={`${categories.find(c => c.value === selectedAssignment.category)?.icon}`}></i>
                          {categories.find(c => c.value === selectedAssignment.category)?.label}
                        </Badge>
                      )}
                      {selectedAssignment.tokenReward > 0 && (
                        <Badge variant="default" className="bg-blue-600">
                          {selectedAssignment.tokenReward} tokens
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {selectedAssignment.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{selectedAssignment.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Due Date</h3>
                      <p className="text-gray-600">
                        {selectedAssignment.dueDate 
                          ? new Date(selectedAssignment.dueDate).toLocaleDateString()
                          : 'No due date set'
                        }
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Created</h3>
                      <p className="text-gray-600">
                        {new Date(selectedAssignment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {user?.role === 'teacher' && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={() => setIsEditing(true)} className="flex-1">
                        <i className="fas fa-edit mr-2"></i>
                        Edit Assignment
                      </Button>
                      <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Assignment title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Assignment description and instructions"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <span className="flex items-center gap-2">
                                <i className={category.icon}></i>
                                {category.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Token Reward</label>
                      <Input
                        type="number"
                        value={editForm.tokenReward}
                        onChange={(e) => setEditForm({ ...editForm, tokenReward: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                    <Input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleUpdateAssignment} disabled={updateAssignmentMutation.isPending} className="flex-1">
                      {updateAssignmentMutation.isPending ? 'Updating...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
