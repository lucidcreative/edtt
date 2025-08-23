import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useClassroom } from '@/contexts/ClassroomContext';
import { apiRequest, queryConfigs } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useAssignments() {
  const { currentClassroom } = useClassroom();
  
  return useQuery({
    queryKey: ['/api/classrooms', currentClassroom?.id, 'assignments'],
    enabled: !!currentClassroom,
    ...queryConfigs.dynamic, // Refresh assignments regularly for real-time updates
  });
}

export function useAssignmentMutations() {
  const { user } = useAuth();
  const { currentClassroom } = useClassroom();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const assignmentData = {
        ...data,
        teacherId: user?.id,
        classroomId: currentClassroom?.id,
      };
      const response = await apiRequest('POST', '/api/assignments', assignmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/classrooms', currentClassroom?.id, 'assignments'] 
      });
      toast({
        title: 'Assignment Created',
        description: 'The assignment has been successfully created.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create assignment',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/assignments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/classrooms', currentClassroom?.id, 'assignments'] 
      });
      toast({
        title: 'Assignment Updated',
        description: 'The assignment has been successfully updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update assignment',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/assignments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/classrooms', currentClassroom?.id, 'assignments'] 
      });
      toast({
        title: 'Assignment Deleted',
        description: 'The assignment has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete assignment',
        variant: 'destructive',
      });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}