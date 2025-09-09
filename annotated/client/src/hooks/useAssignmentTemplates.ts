// React hook for fetching assignment templates using React Query
import { useQuery } from '@tanstack/react-query';
import { queryConfigs } from '@/lib/queryClient';

// Custom hook to fetch assignment templates for reuse in assignment creation
export function useAssignmentTemplates(enabled = true) {
  return useQuery({
    // Query key for React Query cache identification
    queryKey: ['/api/assignment-templates'],
    // Control whether query should run - allows conditional fetching
    enabled,
    // Use stable query configuration - templates rarely change
    ...queryConfigs.stable, // Templates are stable data
  });
}