import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

interface PinSetupProps {
  onPinSetup: (pin: string) => void;
  isLoading: boolean;
  error?: string;
}

export default function PinSetup({ onPinSetup, isLoading, error }: PinSetupProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [validationError, setValidationError] = useState("");

  const validatePin = (pinValue: string): boolean => {
    if (pinValue.length !== 4) {
      setValidationError("PIN must be exactly 4 digits");
      return false;
    }
    if (!/^\d{4}$/.test(pinValue)) {
      setValidationError("PIN must contain only numbers");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handlePinChange = (value: string) => {
    // Only allow numeric input and limit to 4 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    
    if (numericValue.length === 4) {
      validatePin(numericValue);
    } else if (validationError) {
      setValidationError("");
    }
  };

  const handleConfirmPinChange = (value: string) => {
    // Only allow numeric input and limit to 4 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(numericValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePin(pin)) {
      return;
    }
    
    if (pin !== confirmPin) {
      setValidationError("PINs do not match");
      return;
    }
    
    onPinSetup(pin);
  };

  const isPinValid = pin.length === 4 && /^\d{4}$/.test(pin);
  const isPinsMatching = pin === confirmPin && confirmPin.length === 4;
  const canSubmit = isPinValid && isPinsMatching && !validationError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Set Up Your PIN
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a secure 4-digit PIN to access your account
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New PIN
                </label>
                <div className="relative">
                  <Input
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={4}
                    data-testid="input-new-pin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-toggle-pin-visibility"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm PIN
                </label>
                <Input
                  type={showPin ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => handleConfirmPinChange(e.target.value)}
                  placeholder="Confirm 4-digit PIN"
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={4}
                  data-testid="input-confirm-pin"
                />
              </div>

              {validationError && (
                <Alert variant="destructive">
                  <AlertDescription data-testid="text-validation-error">
                    {validationError}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription data-testid="text-setup-error">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>PIN Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li className={pin.length === 4 ? "text-green-600" : ""}>
                      Exactly 4 digits
                    </li>
                    <li className={/^\d+$/.test(pin) ? "text-green-600" : ""}>
                      Numbers only
                    </li>
                    <li className={isPinsMatching ? "text-green-600" : ""}>
                      PINs match
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isLoading}
                  data-testid="button-setup-pin"
                >
                  {isLoading ? "Setting up..." : "Set PIN"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}