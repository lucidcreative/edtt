// Reusable Label component built on Radix UI Label primitive with variant support
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Create label variants using class-variance-authority for consistent styling
const labelVariants = cva(
  // Base styles: small text, medium font weight, no leading, disabled state handling
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

// Forward ref Label component that extends Radix UI Label with variant props
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  // Use Radix UI Label primitive as the base component for accessibility
  <LabelPrimitive.Root
    // Forward ref for parent component access to DOM element
    ref={ref}
    // Apply variant styles combined with custom className
    className={cn(labelVariants(), className)}
    // Spread all other props to the Label primitive
    {...props}
  />
))
// Set display name using Radix primitive's display name for consistency
Label.displayName = LabelPrimitive.Root.displayName

// Export the Label component for use throughout the application
export { Label }