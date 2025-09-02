import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/authUtils";
import PinSetup from "@/components/auth/pin-setup";

export default function ChangePinPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePinSetup = async (pin: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest('POST', '/api/auth/change-pin', {
        newPin: pin
      });

      const data = await response.json();
      
      if (data.success) {
        // Update token if provided
        if (data.token) {
          setAuthToken(data.token);
        }
        
        // Invalidate auth query to refetch user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        toast({
          title: "PIN Updated Successfully",
          description: "Your PIN has been set. You can now access your account.",
        });

        setLocation('/');
      } else {
        throw new Error(data.message || 'Failed to update PIN');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update PIN. Please try again.";
      setError(errorMessage);
      toast({
        title: "PIN Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PinSetup 
      onPinSetup={handlePinSetup}
      isLoading={isLoading}
      error={error}
    />
  );
}