// React hook for detecting mobile screen sizes and responsive behavior
import * as React from "react"

// Mobile breakpoint threshold - matches Tailwind's md breakpoint (768px)
const MOBILE_BREAKPOINT = 768

// Custom hook to detect if current screen size is mobile
export function useIsMobile() {
  // State to track mobile status - undefined initially until effect runs
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create MediaQueryList object to listen for screen size changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    // Callback function to update mobile state when screen size changes
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    // Add event listener for media query changes
    mql.addEventListener("change", onChange)
    // Set initial mobile state based on current window width
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    // Cleanup: remove event listener when component unmounts
    return () => mql.removeEventListener("change", onChange)
  }, []) // Empty dependency array - effect runs once on mount

  // Return boolean mobile status (converts undefined to false)
  return !!isMobile
}