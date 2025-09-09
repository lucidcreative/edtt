// Client-side Sentry configuration for error tracking and performance monitoring
import * as Sentry from '@sentry/react';

// Initialize Sentry error tracking for the client-side React application
export function initializeSentry() {
  // Only initialize if DSN is provided via environment variable
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      // Data Source Name - unique identifier for this project in Sentry
      dsn: import.meta.env.VITE_SENTRY_DSN,
      // Environment tag for filtering errors by deployment environment
      environment: import.meta.env.MODE || 'development',
      integrations: [
        // Browser tracing for performance monitoring and navigation tracking
        Sentry.browserTracingIntegration(),
        // Session replay for debugging - captures user interactions
        Sentry.replayIntegration({
          maskAllText: false, // Don't mask text content for better debugging
          blockAllMedia: false, // Don't block media for complete session capture
        }),
      ],
      // Performance sampling rate - 10% in production, 100% in development
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      // Session replay sampling rate - 10% of normal sessions
      replaysSessionSampleRate: 0.1,
      // Replay sampling rate when errors occur - 100% of error sessions
      replaysOnErrorSampleRate: 1.0,
    });

    // Log successful initialization for debugging purposes
    console.log('Sentry initialized for client-side error tracking');
  } else {
    // Log when Sentry is not configured to avoid silent failures
    console.log('Sentry DSN not provided, skipping client-side error tracking');
  }
}

// Re-export Sentry for use in other parts of the application
export { Sentry };