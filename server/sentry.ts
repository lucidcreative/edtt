import * as Sentry from '@sentry/node';

// Initialize Sentry for server-side error tracking
export function initializeSentry(app: any) {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
      ],
    });

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());

    console.log('Sentry initialized for server-side error tracking');
  } else {
    console.log('Sentry DSN not provided, skipping server-side error tracking');
  }
}

// Error handler middleware (should be added after all routes)
export function sentryErrorHandler(app: any) {
  if (process.env.SENTRY_DSN) {
    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());
  }
}

export { Sentry };