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
  const [selectedCategory, setSelectedCategory] = useState("all");

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
      return apiRequest('POST', '/api/assignments', assignmentData);
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

  const filteredAssignments = assignments?.filter((assignment: any) => 
    selectedCategory === "all" || assignment.category === selectedCategory
  ) || [];

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

      {/* Category Filter */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          data-testid="filter-all"
        >
          All
        </Button>
        {categories.map((category) => (
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
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer" data-testid={`assignment-card-${index}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors" data-testid={`assignment-title-${index}`}>
                          {assignment.title}
                        </CardTitle>
                        {category && (
                          <Badge variant="outline" className={`mt-2 ${category.color}`} data-testid={`assignment-category-${index}`}>
                            <i className={`${category.icon} mr-1`}></i>
                            {category.label}
                          </Badge>
                        )}
                      </div>
                      {assignment.tokenReward > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600" data-testid={`assignment-reward-${index}`}>
                            {assignment.tokenReward}
                          </div>
                          <div className="text-xs text-gray-500">tokens</div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {assignment.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3" data-testid={`assignment-description-${index}`}>
                        {assignment.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      {assignment.dueDate ? (
                        <span data-testid={`assignment-due-date-${index}`}>
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span>No due date</span>
                      )}
                      
                      <span data-testid={`assignment-created-${index}`}>
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {user?.role === 'student' && (
                      <div className="mt-4">
                        <Button size="sm" className="w-full" data-testid={`button-submit-${index}`}>
                          <i className="fas fa-paper-plane mr-2"></i>
                          Submit Assignment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
