import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryConfigs } from '@/lib/queryClient';
import { optimisticUpdates, rollbackUpdates } from '@/lib/optimisticUpdates';
import { useToast } from '@/hooks/use-toast';
import { useClassroom } from '@/contexts/ClassroomContext';
import { useAuth } from '@/hooks/useAuth';

// Hook for time tracking operations with optimistic updates
export function useTimeTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentClassroom } = useClassroom();
  const { user } = useAuth();

  const clockInOutMutation = useMutation({
    mutationFn: async ({ action }: { action: 'clock_in' | 'clock_out' }) => {
      const response = await apiRequest('POST', '/api/time-tracking/clock', {
        action,
        classroomId: currentClassroom?.id,
        studentId: user?.id
      });
      return response.json();
    },
    onMutate: async ({ action }) => {
      // Optimistic update
      if (user?.id && currentClassroom?.id) {
        optimisticUpdates.clockInOut(user.id, action === 'clock_in', currentClassroom.id);
      }
    },
    onSuccess: (data, { action }) => {
      toast({
        title: action === 'clock_in' ? 'Clocked In' : 'Clocked Out',
        description: action === 'clock_in' 
          ? 'You have successfully clocked in.' 
          : `Clocked out. Session time: ${data.sessionDuration || 'N/A'}`,
      });
    },
    onError: (error, { action }) => {
      // Rollback optimistic update by invalidating queries
      if (user?.id && currentClassroom?.id) {
        rollbackUpdates.invalidateRelated([
          ['/api/students', user.id, 'time-status'],
          ['/api/classrooms', currentClassroom.id, 'active-students']
        ]);
      }
      toast({
        title: 'Clock Action Failed',
        description: error instanceof Error ? error.message : `Failed to ${action.replace('_', ' ')}`,
        variant: 'destructive',
      });
    },
  });

  return {
    clockInOutMutation,
  };
}

// Hook for student's current time status with real-time updates
export function useTimeStatus(studentId?: string) {
  const { currentClassroom } = useClassroom();
  
  return useQuery({
    queryKey: ['/api/students', studentId, 'time-status'],
    enabled: !!studentId && !!currentClassroom,
    ...queryConfigs.realTime, // Use real-time cache strategy for clock status
    select: (data) => {
      // Derive view data
      if (!data) return data;
      const now = new Date();
      const clockedInAt = data.currentSessionStart ? new Date(data.currentSessionStart) : null;
      
      return {
        ...data,
        // Add computed fields
        currentSessionDuration: clockedInAt 
          ? Math.floor((now.getTime() - clockedInAt.getTime()) / 1000 / 60) // minutes
          : 0,
        canClockOut: data.isClockedIn && clockedInAt,
        sessionStartTime: clockedInAt?.toLocaleTimeString(),
      };
    },
  });
}

// Hook for classroom active students with real-time updates
export function useActiveStudents() {
  const { currentClassroom } = useClassroom();
  
  return useQuery({
    queryKey: ['/api/classrooms', currentClassroom?.id, 'active-students'],
    enabled: !!currentClassroom,
    ...queryConfigs.realTime, // Real-time updates for active students
    select: (data) => {
      // Derive view data
      if (!data) return data;
      const now = new Date();
      
      return data.map((student: any) => {
        const clockedInAt = new Date(student.clockedInAt);
        return {
          ...student,
          sessionDuration: Math.floor((now.getTime() - clockedInAt.getTime()) / 1000 / 60),
          clockedInTime: clockedInAt.toLocaleTimeString(),
        };
      }).sort((a: any, b: any) => b.sessionDuration - a.sessionDuration);
    },
  });
}