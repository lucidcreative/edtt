import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryConfigs } from '@/lib/queryClient';
import { optimisticUpdates, rollbackUpdates } from '@/lib/optimisticUpdates';
import { useToast } from '@/hooks/use-toast';
import { useClassroom } from '@/contexts/ClassroomContext';

// Hook for token operations with optimistic updates
export function useTokenOperations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentClassroom } = useClassroom();

  const awardTokensMutation = useMutation({
    mutationFn: async ({ studentId, amount, reason }: { studentId: string; amount: number; reason: string }) => {
      const response = await apiRequest('POST', '/api/tokens/award', {
        studentId,
        amount,
        reason,
        classroomId: currentClassroom?.id
      });
      return response.json();
    },
    onMutate: async ({ studentId, amount }) => {
      // Optimistic update
      if (currentClassroom?.id) {
        optimisticUpdates.awardTokens(studentId, amount, currentClassroom.id);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Tokens Awarded',
        description: 'Tokens have been successfully awarded to the student.',
      });
    },
    onError: (error, { studentId }) => {
      // Rollback optimistic update
      if (currentClassroom?.id) {
        rollbackUpdates.tokenAward(studentId, currentClassroom.id);
      }
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to award tokens',
        variant: 'destructive',
      });
    },
  });

  const purchaseItemMutation = useMutation({
    mutationFn: async ({ itemId, studentId }: { itemId: string; studentId: string }) => {
      const response = await apiRequest('POST', '/api/store/purchase', {
        itemId,
        studentId,
        classroomId: currentClassroom?.id
      });
      return response.json();
    },
    onMutate: async ({ studentId, itemId }) => {
      // Get item cost for optimistic update
      const storeItems = queryClient.getQueryData(['/api/classrooms', currentClassroom?.id, 'store']) as any[];
      const item = storeItems?.find((i: any) => i.id === itemId);
      
      if (item && currentClassroom?.id) {
        optimisticUpdates.purchaseItem(studentId, item.cost, currentClassroom.id);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Purchase Successful',
        description: 'Item purchased successfully!',
      });
    },
    onError: (error, { studentId }) => {
      // Rollback optimistic update
      if (currentClassroom?.id) {
        rollbackUpdates.purchase(studentId, currentClassroom.id);
      }
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Failed to purchase item',
        variant: 'destructive',
      });
    },
  });

  return {
    awardTokensMutation,
    purchaseItemMutation,
  };
}

// Hook for student token balance with real-time updates
export function useStudentBalance(studentId?: string) {
  const { currentClassroom } = useClassroom();
  
  return useQuery({
    queryKey: ['/api/students', studentId, 'balance'],
    enabled: !!studentId && !!currentClassroom,
    ...queryConfigs.balances, // Use balance-specific cache strategy
    select: (data) => {
      // Derive view data
      if (!data) return data;
      return {
        ...data,
        // Add computed fields
        canPurchase: (itemCost: number) => data.tokens >= itemCost,
        spendingPower: data.tokens,
        // Level progression
        nextLevelTokens: data.level * 100, // Example calculation
        progressToNextLevel: (data.totalEarnings % 100) / 100
      };
    },
  });
}

// Hook for classroom leaderboard with optimistic updates
export function useClassroomLeaderboard() {
  const { currentClassroom } = useClassroom();
  
  return useQuery({
    queryKey: ['/api/classrooms', currentClassroom?.id, 'leaderboard'],
    enabled: !!currentClassroom,
    ...queryConfigs.dynamic,
    select: (data) => {
      // Derive view data - sort by tokens and add rankings
      if (!data) return data;
      return data
        .sort((a: any, b: any) => b.tokens - a.tokens)
        .map((student: any, index: number) => ({
          ...student,
          rank: index + 1,
          isTop3: index < 3,
        }));
    },
  });
}