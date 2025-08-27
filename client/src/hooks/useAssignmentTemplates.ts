import { useQuery } from '@tanstack/react-query';
import { queryConfigs } from '@/lib/queryClient';

export function useAssignmentTemplates(enabled = true) {
  return useQuery({
    queryKey: ['/api/assignment-templates'],
    enabled,
    ...queryConfigs.stable, // Templates are stable data
  });
}