// 404 Not Found page component for unmatched routes
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// Default export function component for 404 error page
export default function NotFound() {
  return (
    // Full screen container with centered content and light gray background
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      {/* Card container with responsive width and margin */}
      <Card className="w-full max-w-md mx-4">
        {/* Card content with top padding */}
        <CardContent className="pt-6">
          {/* Flex container for icon and heading */}
          <div className="flex mb-4 gap-2">
            {/* Alert circle icon in red to indicate error */}
            <AlertCircle className="h-8 w-8 text-red-500" />
            {/* Main heading with large, bold text */}
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          {/* Developer-friendly message explaining likely cause */}
          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}