// Reusable Input component built on HTML input with consistent styling
import * as React from "react"

import { cn } from "@/lib/utils"

// Forward ref Input component that extends native HTML input props
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        // Pass through the input type (text, password, email, etc.)
        type={type}
        // Combine base styles with custom className using cn utility
        className={cn(
          // Base styles: flexbox, sizing, border, background, padding, text styling
          // Focus styles: ring outline on focus for accessibility
          // File input styles: transparent file button with proper text styling
          // Placeholder styles: muted foreground color
          // Disabled styles: no pointer events and reduced opacity
          // Responsive text size: base on mobile, small on desktop
          // Interactive styles: border color change and shadow on hover
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 hover:border-primary/50 hover:shadow-sm",
          className
        )}
        // Forward ref for parent component access to DOM element
        ref={ref}
        // Spread all other props to the input element
        {...props}
      />
    )
  }
)
// Set display name for React DevTools debugging
Input.displayName = "Input"

// Export the Input component for use throughout the application
export { Input }