import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryConfigs } from '@/lib/queryClient';
import { optimisticUpdates, rollbackUpdates } from '@/lib/optimisticUpdates';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Hook for notification operations with optimistic updates
export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      if (user?.id) {
        optimisticUpdates.markNotificationRead(notificationId, user.id);
      }
    },
    onError: (error, notificationId) => {
      // Rollback optimistic update
      if (user?.id) {
        rollbackUpdates.invalidateRelated([
          ['/api/students', user.id, 'notifications'],
          ['/api/students', user.id, 'unread-count']
        ]);
      }
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  return {
    markAsReadMutation,
  };
}

// Hook for student notifications with real-time updates
export function useStudentNotifications(studentId?: string) {
  return useQuery({
    queryKey: ['/api/students', studentId, 'notifications'],
    enabled: !!studentId,
    ...queryConfigs.dynamic, // Use dynamic cache for notifications
    select: (data) => {
      // Derive view data - sort by date and group by read status
      if (!data) return data;
      const sorted = data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return {
        all: sorted,
        unread: sorted.filter((n: any) => !n.isRead),
        read: sorted.filter((n: any) => n.isRead),
        unreadCount: sorted.filter((n: any) => !n.isRead).length,
      };
    },
  });
}

// Hook for unread notification count with real-time updates
export function useUnreadCount(studentId?: string) {
  return useQuery({
    queryKey: ['/api/students', studentId, 'unread-count'],
    enabled: !!studentId,
    ...queryConfigs.realTime, // Real-time updates for unread count
  });
}