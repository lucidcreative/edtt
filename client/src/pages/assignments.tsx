import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import StudentAssignments from "@/components/student/student-assignments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const categories = [
  { value: "math", label: "Math", icon: "fas fa-calculator", color: "bg-red-100 text-red-600" },
  { value: "science", label: "Science", icon: "fas fa-flask", color: "bg-blue-100 text-blue-600" },
  { value: "history", label: "History", icon: "fas fa-landmark", color: "bg-green-100 text-green-600" },
  { value: "english", label: "English", icon: "fas fa-book", color: "bg-purple-100 text-purple-600" },
  { value: "art", label: "Art", icon: "fas fa-palette", color: "bg-pink-100 text-pink-600" },
];

// Form schema for assignment creation
const assignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  tokenReward: z.number().min(0, "Token reward must be positive"),
  dueDate: z.date().optional(),
  resources: z.array(z.object({
    title: z.string().min(1, "Resource title is required"),
    url: z.string().url("Must be a valid URL")
  })).default([])
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

export default function Assignments() {
  const { user } = useAuth();
  
  // Show student assignments view for students
  if (user?.role === 'student') {
    return <StudentAssignments />;
  }
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Form for creating assignments
  const createForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tokenReward: 0,
      dueDate: undefined,
      resources: []
    }
  });
  
  // Form for editing assignments
  const editForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tokenReward: 0,
      dueDate: undefined,
      resources: []
    }
  });

  const { currentClassroom } = useClassroom();

  // Get assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "assignments"],
    enabled: !!currentClassroom
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const assignmentData = {
        ...data,
        teacherId: user?.id,
        classroomId: currentClassroom?.id
      };
      const response = await apiRequest('POST', '/api/assignments', assignmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", currentClassroom?.id, "assignments"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
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
    mutationFn: async (data: AssignmentFormData) => {
      if (!selectedAssignment) throw new Error("No assignment selected");
      const response = await apiRequest('PATCH', `/api/assignments/${selectedAssignment.id}`, data);
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

  const onCreateSubmit = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate(data);
  };

  const onUpdateSubmit = (data: AssignmentFormData) => {
    updateAssignmentMutation.mutate(data);
  };

  const handleAssignmentClick = (assignment: any) => {
    setSelectedAssignment(assignment);
    editForm.reset({
      title: assignment.title || '',
      description: assignment.description || '',
      category: assignment.category || '',
      tokenReward: assignment.tokenReward || 0,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
      resources: assignment.resources || []
    });
    setIsEditing(false);
    setIsDetailDialogOpen(true);
  };

  const addResource = (form: any) => {
    const currentResources = form.getValues('resources');
    form.setValue('resources', [...currentResources, { title: '', url: '' }]);
  };

  const removeResource = (form: any, index: number) => {
    const currentResources = form.getValues('resources');
    form.setValue('resources', currentResources.filter((_: any, i: number) => i !== index));
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-plus text-white text-sm"></i>
                  </div>
                  Create New Assignment
                </DialogTitle>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignment title" {...field} data-testid="input-assignment-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the assignment and instructions"
                            rows={3}
                            {...field} 
                            data-testid="textarea-assignment-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-assignment-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="tokenReward"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Reward</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-token-reward"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={createForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="input-due-date"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Resources Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Resources & Links</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addResource(createForm)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Resource
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {createForm.watch('resources').map((_, index) => (
                        <div key={index} className="flex items-end gap-2 p-3 border rounded-lg">
                          <FormField
                            control={createForm.control}
                            name={`resources.${index}.title`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-sm">Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Resource title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={createForm.control}
                            name={`resources.${index}.url`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-sm">URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeResource(createForm, index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {createForm.watch('resources').length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No resources added yet. Click "Add Resource" to include helpful links.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1" disabled={createAssignmentMutation.isPending}>
                      {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
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
                  
                  {selectedAssignment.resources && selectedAssignment.resources.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Resources</h3>
                      <div className="space-y-2">
                        {selectedAssignment.resources.map((resource: any, index: number) => (
                          <a
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <i className="fas fa-external-link-alt text-blue-500"></i>
                            <span className="text-blue-600 hover:underline">{resource.title}</span>
                          </a>
                        ))}
                      </div>
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
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-6">
                    <FormField
                      control={editForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignment Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter assignment title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the assignment and instructions"
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="tokenReward"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Reward</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={editForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Resources Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Resources & Links</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addResource(editForm)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Resource
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {editForm.watch('resources').map((_, index) => (
                          <div key={index} className="flex items-end gap-2 p-3 border rounded-lg">
                            <FormField
                              control={editForm.control}
                              name={`resources.${index}.title`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel className="text-sm">Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Resource title" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name={`resources.${index}.url`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel className="text-sm">URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeResource(editForm, index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {editForm.watch('resources').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No resources added yet. Click "Add Resource" to include helpful links.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1" disabled={updateAssignmentMutation.isPending}>
                        {updateAssignmentMutation.isPending ? 'Updating...' : 'Save Changes'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
