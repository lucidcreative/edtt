// Authentication hook using React Query for user session management
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

// TypeScript interface for authentication API response structure
interface AuthResponse {
  user: User;
}

// Custom hook to manage user authentication state throughout the application
export function useAuth() {
  // Use React Query to fetch and cache user authentication status
  const { data: authData, isLoading, error } = useQuery<AuthResponse>({
    // Query key for React Query cache identification
    queryKey: ["/api/auth/me"],
    // Don't retry failed requests - authentication failures should be immediate
    retry: false,
    // Cache data for 5 minutes to reduce unnecessary API calls
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Return authentication state and user data for consuming components
  return {
    // Current authenticated user object or undefined
    user: authData?.user,
    // Loading state while authentication check is in progress
    isLoading,
    // Boolean indicating if user is authenticated (has valid session)
    isAuthenticated: !!authData?.user && !error,
    // Any error that occurred during authentication check
    error
  };
}