import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const assignmentFormSchema = z.object({
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

export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface UseAssignmentFormProps {
  classroomId: string;
  editingAssignment?: any;
  onSuccess?: (assignment: any) => void;
  onCancel?: () => void;
}

export function useAssignmentForm({ 
  classroomId, 
  editingAssignment, 
  onSuccess, 
  onCancel 
}: UseAssignmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [learningObjective, setLearningObjective] = useState('');
  const [subjectTag, setSubjectTag] = useState('');

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: editingAssignment?.title || '',
      description: editingAssignment?.description || '',
      learningObjectives: editingAssignment?.learningObjectives || [],
      category: editingAssignment?.category || '',
      subjectTags: editingAssignment?.subjectTags || [],
      submissionInstructions: editingAssignment?.submissionInstructions || '',
      acceptedLinkTypes: editingAssignment?.acceptedLinkTypes || ['google_drive'],
      requiredPermissions: editingAssignment?.requiredPermissions || 'view',
      submissionFormatNotes: editingAssignment?.submissionFormatNotes || '',
      dueDate: editingAssignment?.dueDate 
        ? new Date(editingAssignment.dueDate).toISOString().split('T')[0]
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lateSubmissionAllowed: editingAssignment?.lateSubmissionAllowed ?? true,
      latePenaltyPercentage: editingAssignment?.latePenaltyPercentage || '10.00',
      baseTokenReward: editingAssignment?.baseTokenReward?.toString() || '50',
      earlySubmissionBonus: editingAssignment?.earlySubmissionBonus || '10.00',
      qualityBonusMax: editingAssignment?.qualityBonusMax || '20.00',
      maxSubmissions: editingAssignment?.maxSubmissions || 1,
      deadlineWeight: editingAssignment?.deadlineWeight || '0.25',
      instructionFollowingWeight: editingAssignment?.instructionFollowingWeight || '0.25',
      communicationWeight: editingAssignment?.communicationWeight || '0.25',
      presentationWeight: editingAssignment?.presentationWeight || '0.25',
      visibleToStudents: editingAssignment?.visibleToStudents ?? false,
      academicPeriod: editingAssignment?.academicPeriod || 'current'
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const endpoint = editingAssignment 
        ? `/api/assignments/${editingAssignment.id}`
        : '/api/assignments';
      const method = editingAssignment ? 'PATCH' : 'POST';
      
      const response = await apiRequest(method, endpoint, {
        ...data,
        classroomId,
        baseTokenReward: parseInt(data.baseTokenReward),
        earlySubmissionBonus: parseFloat(data.earlySubmissionBonus),
        qualityBonusMax: parseFloat(data.qualityBonusMax),
        latePenaltyPercentage: parseFloat(data.latePenaltyPercentage),
        deadlineWeight: parseFloat(data.deadlineWeight),
        instructionFollowingWeight: parseFloat(data.instructionFollowingWeight),
        communicationWeight: parseFloat(data.communicationWeight),
        presentationWeight: parseFloat(data.presentationWeight),
      });
      return response.json();
    },
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/classrooms', classroomId, 'assignments'] 
      });
      toast({
        title: editingAssignment ? 'Assignment Updated' : 'Assignment Created',
        description: `The assignment has been successfully ${editingAssignment ? 'updated' : 'created'}.`,
      });
      onSuccess?.(assignment);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save assignment',
        variant: 'destructive',
      });
    },
  });

  const addLearningObjective = () => {
    if (learningObjective.trim()) {
      const currentObjectives = form.getValues('learningObjectives');
      form.setValue('learningObjectives', [...currentObjectives, learningObjective.trim()]);
      setLearningObjective('');
    }
  };

  const removeLearningObjective = (index: number) => {
    const currentObjectives = form.getValues('learningObjectives');
    form.setValue('learningObjectives', currentObjectives.filter((_, i) => i !== index));
  };

  const addSubjectTag = () => {
    if (subjectTag.trim()) {
      const currentTags = form.getValues('subjectTags');
      if (!currentTags.includes(subjectTag.trim())) {
        form.setValue('subjectTags', [...currentTags, subjectTag.trim()]);
      }
      setSubjectTag('');
    }
  };

  const removeSubjectTag = (index: number) => {
    const currentTags = form.getValues('subjectTags');
    form.setValue('subjectTags', currentTags.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: AssignmentFormData) => {
    createMutation.mutate(data);
  };

  return {
    form,
    learningObjective,
    setLearningObjective,
    subjectTag,
    setSubjectTag,
    addLearningObjective,
    removeLearningObjective,
    addSubjectTag,
    removeSubjectTag,
    handleSubmit,
    isSubmitting: createMutation.isPending,
    onCancel,
  };
}