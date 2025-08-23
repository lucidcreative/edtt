import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuthToken } from "./authUtils";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Smart caching strategy for better performance
      staleTime: 1000 * 60 * 5, // 5 minutes - data becomes stale after 5 min
      gcTime: 1000 * 60 * 30, // 30 minutes - data stays in cache for 30 min
      refetchOnWindowFocus: true, // Refetch when user returns to app
      refetchOnMount: true, // Refetch when component mounts with stale data
      refetchOnReconnect: true, // Refetch when network reconnects
      retry: 3, // Retry failed requests 3 times with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Background refetching for better UX
      refetchInterval: false, // Don't auto-refetch by default (set per query as needed)
      // Network optimizations
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

// Custom query configurations for different data types
export const queryConfigs = {
  // Real-time data (user tokens, active time entries)
  realTime: {
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  },
  // Frequently changing data (assignments, announcements)
  dynamic: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  },
  // Moderately stable data (classroom info, store items)
  stable: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },
  // Static data (user profile, classroom settings)
  static: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  },
  // Lists with pagination
  list: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    keepPreviousData: true, // Keep old data while fetching new
  },
};

// Helper function to invalidate related queries efficiently
export const invalidateQueries = {
  classroom: (classroomId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'students'] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'leaderboard'] });
  },
  student: (studentId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/students', studentId] });
    queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'progress'] });
    queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'assignments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'enrollments'] });
  },
  assignments: (classroomId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'assignments'] });
  },
  store: (classroomId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/store'] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'store'] });
  },
  announcements: (classroomId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'announcements'] });
  },
};
