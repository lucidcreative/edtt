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
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // No need to manually add Authorization header - httpOnly cookies are sent automatically

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // This ensures cookies are sent with the request
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
    const headers: Record<string, string> = {};
    
    // No need to manually add Authorization header - httpOnly cookies are sent automatically

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include", // This ensures cookies are sent with the request
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
      // NO GLOBAL STALE TIME - use per-query configurations
      gcTime: 1000 * 60 * 30, // 30 minutes - data stays in cache for 30 min
      refetchOnWindowFocus: false, // Disable global refetch, enable per-query as needed
      refetchOnMount: true, // Refetch when component mounts with stale data
      refetchOnReconnect: true, // Refetch when network reconnects
      retry: 3, // Retry failed requests 3 times with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Background refetching disabled globally, enabled per-query
      refetchInterval: false,
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

// Per-query cache strategies - optimized for each data type
export const queryConfigs = {
  // Real-time data (user tokens, active sessions, clock in/out status)
  realTime: {
    staleTime: 0, // Always stale - refetch immediately
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    gcTime: 1000 * 60 * 5, // Short cache time for real-time data
  },
  
  // Frequently changing data (assignments, submissions, announcements)
  dynamic: {
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    gcTime: 1000 * 60 * 15, // 15 minutes cache
  },
  
  // User balances and token data
  balances: {
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    gcTime: 1000 * 60 * 10,
  },
  
  // Store items and marketplace data
  store: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  },
  
  // User profiles and settings
  profile: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 60, // 1 hour cache
  },
  
  // Classroom and administrative data
  classroom: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 45, // 45 minutes cache
  },
  
  // Lists with pagination
  list: {
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 20,
  },
  
  // Static reference data (categories, templates)
  static: {
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 1000 * 60 * 60 * 4, // 4 hours cache
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
