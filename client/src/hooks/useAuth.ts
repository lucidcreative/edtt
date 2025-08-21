import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: authData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: authData?.user,
    isLoading,
    isAuthenticated: !!authData?.user && !error,
    error
  };
}
