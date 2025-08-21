import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar, 
  FileText, 
  Target, 
  Link2, 
  DollarSign, 
  Clock, 
  Users, 
  Settings,
  BookOpen,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Save,
  Wand2,
  Plus,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const assignmentFormSchema = z.object({
  title: z.string().min(1, 'Assignment title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  learningObjectives: z.array(z.string()).min(1, 'At least one learning objective is required'),
  category: z.string().min(1, 'Category is required'),
  subjectTags: z.array(z.string()),
  submissionInstructions: z.string().min(20, 'Submission instructions must be detailed'),
  acceptedLinkTypes: z.array(z.string()).min(1, 'At least one link type must be accepted'),
  requiredPermissions: z.string(),
  submissionFormatNotes: z.string().optional(),
  dueDate: z.string(),
  lateSubmissionAllowed: z.boolean(),
  latePenaltyPercentage: z.string(),
  baseTokenReward: z.string().min(1, 'Token reward is required'),
  earlySubmissionBonus: z.string(),
  qualityBonusMax: z.string(),
  maxSubmissions: z.number().min(1),
  deadlineWeight: z.string(),
  instructionFollowingWeight: z.string(),
  communicationWeight: z.string(),
  presentationWeight: z.string(),
  visibleToStudents: z.boolean(),
  academicPeriod: z.string().optional()
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface AssignmentCreatorProps {
  classroomId: string;
  onAssignmentCreated?: (assignment: any) => void;
  editingAssignment?: any;
  onCancel?: () => void;
}

const LINK_TYPES = [
  { id: 'google_drive', label: 'Google Drive', icon: '📁', description: 'Documents, presentations, spreadsheets' },
  { id: 'youtube', label: 'YouTube', icon: '📹', description: 'Video presentations and tutorials' },
  { id: 'dropbox', label: 'Dropbox', icon: '📦', description: 'File sharing and collaboration' },
  { id: 'padlet', label: 'Padlet', icon: '📌', description: 'Digital bulletin boards' },
  { id: 'canva', label: 'Canva', icon: '🎨', description: 'Design and infographics' },
  { id: 'prezi', label: 'Prezi', icon: '🎯', description: 'Interactive presentations' }
];

const CATEGORIES = [
  'homework', 'project', 'quiz', 'presentation', 'research', 'creative', 'collaboration', 'reflection'
];

const PERMISSION_LEVELS = [
  { value: 'view', label: 'View Only', description: 'Teacher can view submissions' },
  { value: 'comment', label: 'Comment Access', description: 'Teacher can leave comments' },
  { value: 'edit', label: 'Edit Access', description: 'Teacher can edit submissions (if platform allows)' }
];

export function AssignmentCreator({ classroomId, onAssignmentCreated, editingAssignment, onCancel }: AssignmentCreatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [learningObjective, setLearningObjective] = useState('');
  const [subjectTag, setSubjectTag] = useState('');

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: '',
      description: '',
      learningObjectives: [],
      category: '',
      subjectTags: [],
      submissionInstructions: '',
      acceptedLinkTypes: ['google_drive'],
      requiredPermissions: 'view',
      submissionFormatNotes: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lateSubmissionAllowed: true,
      latePenaltyPercentage: '10.00',
      baseTokenReward: '50',
      earlySubmissionBonus: '10.00',
      qualityBonusMax: '20.00',
      maxSubmissions: 1,
      deadlineWeight: '0.25',
      instructionFollowingWeight: '0.25',
      communicationWeight: '0.25',
      presentationWeight: '0.25',
      visibleToStudents: false,
      academicPeriod: 'current'
    }
  });

  // Load templates for teacher efficiency
  const { data: templates } = useQuery({
    queryKey: ['/api/assignment-templates'],
    enabled: !editingAssignment
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const endpoint = editingAssignment 
        ? `/api/assignments/${editingAssignment.id}`
        : '/api/assignments';
      
      return apiRequest(endpoint, {
        method: editingAssignment ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...data,
          classroomId,
          dueDate: new Date(data.dueDate).toISOString()
        })
      });
    },
    onSuccess: (response) => {
      toast({
        title: editingAssignment ? 'Assignment Updated' : 'Assignment Created',
        description: 'Students will be able to view and submit their work.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', classroomId] });
      onAssignmentCreated?.(response.assignment);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assignment',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate(data);
  };

  const addLearningObjective = () => {
    if (learningObjective.trim()) {
      const current = form.getValues('learningObjectives');
      form.setValue('learningObjectives', [...current, learningObjective.trim()]);
      setLearningObjective('');
    }
  };

  const removeLearningObjective = (index: number) => {
    const current = form.getValues('learningObjectives');
    form.setValue('learningObjectives', current.filter((_, i) => i !== index));
  };

  const addSubjectTag = () => {
    if (subjectTag.trim()) {
      const current = form.getValues('subjectTags');
      if (!current.includes(subjectTag.trim())) {
        form.setValue('subjectTags', [...current, subjectTag.trim()]);
      }
      setSubjectTag('');
    }
  };

  const removeSubjectTag = (tag: string) => {
    const current = form.getValues('subjectTags');
    form.setValue('subjectTags', current.filter(t => t !== tag));
  };

  const loadTemplate = (template: any) => {
    form.setValue('title', template.titleTemplate || '');
    form.setValue('description', template.descriptionTemplate || '');
    form.setValue('learningObjectives', template.learningObjectivesTemplate || []);
    form.setValue('submissionInstructions', template.submissionInstructionsTemplate || '');
    form.setValue('baseTokenReward', template.defaultTokenReward || '50');
    form.setValue('acceptedLinkTypes', template.recommendedLinkTypes || ['google_drive']);
    
    toast({
      title: 'Template Loaded',
      description: `Applied "${template.templateName}" template. Customize as needed.`,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </CardTitle>
              <CardDescription>
                Design professional assignments with link-based submissions
              </CardDescription>
            </div>
          </div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="submission" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Submission
                </TabsTrigger>
                <TabsTrigger value="grading" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Grading
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                {/* Template Selector */}
                {!editingAssignment && templates?.templates?.length > 0 && (
                  <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-purple-600" />
                        <CardTitle className="text-sm">Quick Start Templates</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {templates.templates.slice(0, 4).map((template: any) => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            onClick={() => loadTemplate(template)}
                            className="justify-start h-auto p-3"
                          >
                            <div className="text-left">
                              <div className="font-medium">{template.templateName}</div>
                              <div className="text-xs text-muted-foreground">{template.category}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Assignment Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Digital Portfolio Presentation"
                            className="text-lg"
                            {...field}
                            data-testid="input-assignment-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-assignment-category">
                              <SelectValue placeholder="Select assignment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-due-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the assignment, its purpose, and what students should achieve..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-assignment-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide clear context and expectations for students
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Learning Objectives */}
                <div className="space-y-3">
                  <FormLabel>Learning Objectives</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a learning objective..."
                      value={learningObjective}
                      onChange={(e) => setLearningObjective(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningObjective())}
                      data-testid="input-learning-objective"
                    />
                    <Button
                      type="button"
                      onClick={addLearningObjective}
                      size="sm"
                      data-testid="button-add-objective"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('learningObjectives').map((objective, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {objective}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeLearningObjective(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    Define what students will learn or accomplish
                  </FormDescription>
                </div>

                {/* Subject Tags */}
                <div className="space-y-3">
                  <FormLabel>Subject Tags (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add subject tags (e.g., math, science)..."
                      value={subjectTag}
                      onChange={(e) => setSubjectTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubjectTag())}
                      data-testid="input-subject-tag"
                    />
                    <Button
                      type="button"
                      onClick={addSubjectTag}
                      size="sm"
                      data-testid="button-add-tag"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('subjectTags').map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeSubjectTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="submission" className="space-y-6">
                <FormField
                  control={form.control}
                  name="submissionInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed instructions on how students should submit their work, including file naming conventions, sharing settings, and any specific requirements..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-submission-instructions"
                        />
                      </FormControl>
                      <FormDescription>
                        Clear instructions help students follow professional submission practices
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Accepted Link Types */}
                <div className="space-y-4">
                  <FormLabel>Accepted Platforms</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {LINK_TYPES.map(platform => (
                      <Card
                        key={platform.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          form.watch('acceptedLinkTypes').includes(platform.id)
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => {
                          const current = form.getValues('acceptedLinkTypes');
                          if (current.includes(platform.id)) {
                            form.setValue('acceptedLinkTypes', current.filter(id => id !== platform.id));
                          } else {
                            form.setValue('acceptedLinkTypes', [...current, platform.id]);
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{platform.icon}</span>
                            <div>
                              <div className="font-medium">{platform.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {platform.description}
                              </div>
                            </div>
                            {form.watch('acceptedLinkTypes').includes(platform.id) && (
                              <CheckCircle className="h-5 w-5 text-blue-600 ml-auto" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <FormDescription>
                    Select platforms where students can submit their work
                  </FormDescription>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="requiredPermissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Permissions</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-permissions">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PERMISSION_LEVELS.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                <div>
                                  <div className="font-medium">{level.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {level.description}
                                  </div>
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
                    control={form.control}
                    name="maxSubmissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Submissions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-submissions"
                          />
                        </FormControl>
                        <FormDescription>
                          Allow students to resubmit their work
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="submissionFormatNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Format Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional requirements for file formats, naming conventions, or presentation style..."
                          {...field}
                          data-testid="textarea-format-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="grading" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="baseTokenReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Base Token Reward
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="50"
                            {...field}
                            data-testid="input-base-tokens"
                          />
                        </FormControl>
                        <FormDescription>
                          Tokens awarded for completion
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="earlySubmissionBonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Early Bonus
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="10.00"
                            {...field}
                            data-testid="input-early-bonus"
                          />
                        </FormControl>
                        <FormDescription>
                          Extra tokens for early submission
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qualityBonusMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Quality Bonus Max
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="20.00"
                            {...field}
                            data-testid="input-quality-bonus"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum quality bonus tokens
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Professional Skills Weights
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="deadlineWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timeliness</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              {...field}
                              data-testid="input-deadline-weight"
                            />
                          </FormControl>
                          <FormDescription>0.0 - 1.0</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="instructionFollowingWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              {...field}
                              data-testid="input-instruction-weight"
                            />
                          </FormControl>
                          <FormDescription>0.0 - 1.0</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="communicationWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Communication</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              {...field}
                              data-testid="input-communication-weight"
                            />
                          </FormControl>
                          <FormDescription>0.0 - 1.0</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="presentationWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Presentation</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              {...field}
                              data-testid="input-presentation-weight"
                            />
                          </FormControl>
                          <FormDescription>0.0 - 1.0</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Professional skills help students develop real-world competencies
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="lateSubmissionAllowed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-late-submissions"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Allow Late Submissions</FormLabel>
                          <FormDescription>
                            Students can submit after the deadline with penalty
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  {form.watch('lateSubmissionAllowed') && (
                    <FormField
                      control={form.control}
                      name="latePenaltyPercentage"
                      render={({ field }) => (
                        <FormItem className="ml-6">
                          <FormLabel>Late Penalty %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="5"
                              className="w-20"
                              {...field}
                              data-testid="input-late-penalty"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="visibleToStudents"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Publish Assignment
                          </FormLabel>
                          <FormDescription>
                            Make this assignment visible to students immediately
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-visible-to-students"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="academicPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Period (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Quarter 1, Semester 2"
                            {...field}
                            data-testid="input-academic-period"
                          />
                        </FormControl>
                        <FormDescription>
                          Help organize assignments by time period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Professional Development Focus
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        This assignment system helps students develop professional skills through:
                        deadline management, clear communication, following instructions, and presentation quality.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {form.watch('visibleToStudents') ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Will be published immediately
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Will be saved as draft
                  </>
                )}
              </div>
              
              <div className="flex gap-3">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={createAssignmentMutation.isPending}
                  className="min-w-[120px]"
                  data-testid="button-save-assignment"
                >
                  {createAssignmentMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}