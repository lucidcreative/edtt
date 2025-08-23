import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryConfigs } from '@/lib/queryClient';
import { useClassroom } from '@/contexts/ClassroomContext';

// Hook for virtualized roster data with optimized loading
export function useVirtualizedRoster() {
  const { currentClassroom } = useClassroom();
  
  return useQuery({
    queryKey: ['/api/classrooms', currentClassroom?.id, 'students'],
    enabled: !!currentClassroom,
    ...queryConfigs.dynamic,
    select: (data) => {
      if (!data) return [];
      
      // Pre-sort and enhance data for virtualization
      return data
        .filter((student: any) => student.isActive)
        .map((student: any, index: number) => ({
          ...student,
          rank: index + 1,
          displayName: student.name || student.username,
          tokenRank: data.filter((s: any) => s.tokens > student.tokens).length + 1,
        }))
        .sort((a: any, b: any) => b.tokens - a.tokens);
    },
  });
}

// Hook for virtualized assignments with performance optimizations
export function useVirtualizedAssignments() {
  const { currentClassroom } = useClassroom();
  
  return useQuery({
    queryKey: ['/api/classrooms', currentClassroom?.id, 'assignments'],
    enabled: !!currentClassroom,
    ...queryConfigs.dynamic,
    select: (data) => {
      if (!data) return [];
      
      const now = new Date();
      
      // Pre-process assignments for virtualization
      return data
        .filter((assignment: any) => assignment.isActive)
        .map((assignment: any) => {
          const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
          const isOverdue = dueDate && dueDate < now;
          const isDueSoon = dueDate && !isOverdue && 
            (dueDate.getTime() - now.getTime()) <= (3 * 24 * 60 * 60 * 1000); // 3 days
          
          return {
            ...assignment,
            isOverdue,
            isDueSoon,
            daysUntilDue: dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null,
            urgencyScore: isOverdue ? 1000 : (isDueSoon ? 100 : 0), // For sorting
          };
        })
        .sort((a: any, b: any) => {
          // Sort by urgency, then due date
          if (a.urgencyScore !== b.urgencyScore) {
            return b.urgencyScore - a.urgencyScore;
          }
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    },
  });
}

// Hook for virtualized store items with enhanced filtering
export function useVirtualizedStore() {
  const { currentClassroom } = useClassroom();
  
  return useQuery({
    queryKey: ['/api/classrooms', currentClassroom?.id, 'store'],
    enabled: !!currentClassroom,
    ...queryConfigs.store,
    select: (data) => {
      if (!data) return [];
      
      // Pre-process store items for virtualization
      return data
        .filter((item: any) => item.isActive)
        .map((item: any) => ({
          ...item,
          isInStock: item.inventory === -1 || item.inventory > 0,
          affordabilityTier: item.cost <= 10 ? 'low' : item.cost <= 50 ? 'medium' : 'high',
          displayCategory: item.category || 'General',
        }))
        .sort((a: any, b: any) => {
          // Sort by category, then by cost
          if (a.displayCategory !== b.displayCategory) {
            return a.displayCategory.localeCompare(b.displayCategory);
          }
          return a.cost - b.cost;
        });
    },
  });
}

// Hook for search and filtering virtualized data
export function useVirtualizedSearch<T>(
  data: T[] | undefined,
  searchTerm: string,
  searchKeys: (keyof T)[]
) {
  return useMemo(() => {
    if (!data || !searchTerm.trim()) return data || [];
    
    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(term);
        }
        if (typeof value === 'number') {
          return value.toString().includes(term);
        }
        return false;
      })
    );
  }, [data, searchTerm, searchKeys]);
}

// Hook for virtualized pagination (if needed for very large datasets)
export function useVirtualizedPagination<T>(
  data: T[] | undefined,
  pageSize: number = 100
) {
  return useMemo(() => {
    if (!data) return { pages: [], totalPages: 0, totalItems: 0 };
    
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const pages = [];
    
    for (let i = 0; i < totalPages; i++) {
      const start = i * pageSize;
      const end = Math.min(start + pageSize, totalItems);
      pages.push({
        pageNumber: i + 1,
        items: data.slice(start, end),
        startIndex: start,
        endIndex: end - 1,
      });
    }
    
    return { pages, totalPages, totalItems };
  }, [data, pageSize]);
}