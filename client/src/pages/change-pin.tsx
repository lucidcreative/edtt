import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function ChangePinPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePIN = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newPin = formData.get('newPin') as string;
    const confirmPin = formData.get('confirmPin') as string;

    if (newPin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "Please make sure both PINs are the same.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await apiRequest('POST', '/api/auth/change-pin', {
        newPin
      });

      toast({
        title: "PIN Changed Successfully!",
        description: "Your PIN has been updated. You can now access all features.",
      });

      setLocation('/');
    } catch (error) {
      toast({
        title: "Failed to change PIN",
        description: error instanceof Error ? error.message : "Unable to change PIN",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-key text-2xl text-white"></i>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Change Your PIN
            </CardTitle>
            <p className="text-gray-600">
              This is your first login. Please change your temporary PIN to something you'll remember.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleChangePIN} className="space-y-4">
              <div>
                <Label htmlFor="newPin">New PIN</Label>
                <Input
                  id="newPin"
                  name="newPin"
                  type="password"
                  placeholder="••••••"
                  maxLength={6}
                  pattern="[0-9]*"
                  required
                  data-testid="input-new-pin"
                  className="mt-1 text-center text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">4-6 digits, numbers only</p>
              </div>
              
              <div>
                <Label htmlFor="confirmPin">Confirm New PIN</Label>
                <Input
                  id="confirmPin"
                  name="confirmPin"
                  type="password"
                  placeholder="••••••"
                  maxLength={6}
                  pattern="[0-9]*"
                  required
                  data-testid="input-confirm-pin"
                  className="mt-1 text-center text-lg"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                disabled={isLoading}
                data-testid="button-change-pin"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Changing PIN...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Change PIN
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                <strong>Important:</strong> Remember your new PIN. You'll need it to log in next time.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}