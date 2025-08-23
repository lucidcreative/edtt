import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const submissionFormSchema = z.object({
  submissionUrl: z.string().url('Please enter a valid URL'),
  linkTitle: z.string().min(1, 'Please provide a title for your submission'),
  studentNotes: z.string().optional(),
  linkType: z.string().optional()
});

export type SubmissionFormData = z.infer<typeof submissionFormSchema>;

interface UseSubmissionFormProps {
  assignment: any;
  existingSubmission?: any;
  onSubmissionComplete?: () => void;
}

export function useSubmissionForm({ 
  assignment, 
  existingSubmission, 
  onSubmissionComplete 
}: UseSubmissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      submissionUrl: existingSubmission?.submissionUrl || '',
      linkTitle: existingSubmission?.linkTitle || '',
      studentNotes: existingSubmission?.studentNotes || '',
      linkType: existingSubmission?.linkType || ''
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      const endpoint = existingSubmission 
        ? `/api/submissions/${existingSubmission.id}`
        : '/api/submissions';
      const method = existingSubmission ? 'PATCH' : 'POST';
      
      const submissionData = {
        ...data,
        assignmentId: assignment.id,
        linkType: selectedPlatform || data.linkType
      };

      const response = await apiRequest(method, endpoint, submissionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/assignments', assignment.id, 'submissions'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/student/assignments'] 
      });
      
      toast({
        title: existingSubmission ? 'Submission Updated' : 'Submission Created',
        description: `Your assignment submission has been ${existingSubmission ? 'updated' : 'submitted'} successfully.`,
      });
      
      onSubmissionComplete?.();
    },
    onError: (error) => {
      toast({
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'Failed to submit assignment',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: SubmissionFormData) => {
    submitMutation.mutate(data);
  };

  const detectPlatform = (url: string) => {
    if (/drive\.google\.com/.test(url)) return 'google_drive';
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/dropbox\.com/.test(url)) return 'dropbox';
    if (/padlet\.com/.test(url)) return 'padlet';
    if (/canva\.com/.test(url)) return 'canva';
    if (/prezi\.com/.test(url)) return 'prezi';
    return null;
  };

  const validateUrl = (url: string) => {
    const detected = detectPlatform(url);
    if (detected && assignment.acceptedLinkTypes?.includes(detected)) {
      setSelectedPlatform(detected);
      return true;
    }
    return false;
  };

  return {
    form,
    selectedPlatform,
    setSelectedPlatform,
    handleSubmit,
    detectPlatform,
    validateUrl,
    isSubmitting: submitMutation.isPending,
    isExistingSubmission: !!existingSubmission
  };
}