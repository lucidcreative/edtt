// Server-side Sentry configuration for error tracking and performance monitoring
import * as Sentry from '@sentry/node';

// Initialize Sentry for server-side error tracking with Express integration
export function initializeSentry(app: any) {
  // Only initialize if DSN is provided via environment variable
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      // Data Source Name - unique identifier for this project in Sentry
      dsn: process.env.SENTRY_DSN,
      // Environment tag for filtering errors by deployment environment
      environment: process.env.NODE_ENV || 'development',
      // Performance sampling rate - 10% in production, 100% in development
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        // HTTP integration for tracking HTTP requests and responses
        new Sentry.Integrations.Http({ tracing: true }),
        // Express integration for automatic route and middleware tracking
        new Sentry.Integrations.Express({ app }),
      ],
    });

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    
    // TracingHandler creates a trace for every incoming request for performance monitoring
    app.use(Sentry.Handlers.tracingHandler());

    // Log successful initialization for debugging purposes
    console.log('Sentry initialized for server-side error tracking');
  } else {
    // Log when Sentry is not configured to avoid silent failures
    console.log('Sentry DSN not provided, skipping server-side error tracking');
  }
}

// Error handler middleware (should be added after all routes but before other error handlers)
export function sentryErrorHandler(app: any) {
  // Only add error handler if Sentry is configured
  if (process.env.SENTRY_DSN) {
    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());
  }
}

// Re-export Sentry for use in other parts of the server application
export { Sentry };