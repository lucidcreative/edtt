# BizCoin Educational Platform - Technical Context

## Architecture Overview

BizCoin is a full-stack educational platform implementing a gamified classroom management system with token economy mechanics. The application uses a modern TypeScript-based architecture with server-side rendering capabilities and real-time features.

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Radix UI components
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM
- **Authentication**: JWT tokens + Passport.js with dual auth (email/password for teachers, nickname/PIN for students)
- **State Management**: TanStack React Query for server state, React Context for global state
- **Build System**: Vite with ESBuild for production, TSX for development
- **Testing**: Vitest for unit tests, Playwright for E2E testing
- **Deployment**: Replit-optimized with development/production configurations

### Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route-level page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React context providers
│   │   └── lib/           # Utility libraries and configurations
├── server/                # Backend Express application
│   ├── routes/           # API route handlers
│   ├── middleware/       # Authentication & RBAC middleware
│   └── storage.ts        # Data access layer
├── shared/               # Shared TypeScript definitions
│   └── schema.ts         # Database schema and types
└── tests/               # Test suites
```

## Database Architecture

### Primary Tables

1. **users**: Unified table for teachers and students with role-based fields
2. **classrooms**: Teacher-owned classroom spaces with settings
3. **enrollments**: Student classroom membership requests/approvals
4. **assignments**: Teacher-created tasks with token rewards
5. **submissions**: Student assignment submissions with grading
6. **store_items**: Virtual items purchasable with tokens
7. **badges/challenges**: Gamification elements with progress tracking
8. **announcements**: Teacher-to-class communication
9. **time_tracking_sessions**: Optional time logging for token earning

### Key Relationships

- Teachers own multiple classrooms (1:N)
- Students can join multiple classrooms (M:N via enrollments)
- Assignments belong to classrooms and teachers (N:1)
- Submissions link students to assignments (N:1:1)
- Token transactions track all economy activity

### Database Indexes

Strategic indexes on:
- User lookups (email, username, role)
- Classroom access (teacherId, joinCode, isActive)
- Assignment filtering (classroomId, isActive, dueDate)
- Enrollment status queries (studentId, classroomId, status)

## API Architecture

### Authentication Flow

1. **Teachers**: Email/password → JWT token (8-hour expiration)
2. **Students**: Nickname/PIN → JWT token (8-hour expiration)
3. **Authorization**: RBAC middleware checks role + resource ownership

### API Design Patterns

- RESTful endpoints with consistent naming (`/api/resource` or `/api/resource/:id`)
- Role-based access control with middleware chains
- Standardized error responses with proper HTTP status codes
- Request/response validation using Zod schemas
- Optimistic updates supported via TanStack Query

### Key Endpoints

```
Authentication:
POST /api/auth/register/teacher
POST /api/auth/login/teacher  
POST /api/auth/register/student
POST /api/auth/login/student

Core Resources:
GET/POST/PUT/DELETE /api/classrooms
GET/POST/PUT/DELETE /api/assignments
GET/POST /api/submissions
GET/POST/PUT/DELETE /api/store-items
GET/POST /api/badges
GET/POST /api/challenges

Analytics:
GET /api/analytics/classroom/:id/*
GET /api/time-tracking/classroom/:id/*
```

## Security Implementation

### Authentication & Authorization

- **JWT Secret**: Environment-based with development fallback
- **Password Hashing**: bcrypt with 12+ rounds
- **PIN Encryption**: Separate hashing for student PINs
- **Session Management**: 8-hour token expiration with refresh capability
- **Role-Based Access**: Middleware enforcement at route level

### Security Middleware Stack

1. **Helmet**: Security headers and CSP policies
2. **CORS**: Origin-based restrictions in production
3. **Rate Limiting**: 100 requests per 15-minute window (disabled in dev)
4. **Compression**: Response compression for performance
5. **Request Size Limits**: 10MB body size limit
6. **Cookie Security**: Secure cookie parsing and handling

### Data Protection

- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: SameSite cookie attributes

## Frontend Architecture

### Component Organization

- **UI Components**: Atomic design with Radix UI primitives
- **Feature Components**: Business logic components organized by domain
- **Page Components**: Route-level containers with data fetching
- **Layout Components**: Responsive layout with mobile-first approach

### State Management Strategy

- **Server State**: TanStack React Query with caching and optimistic updates
- **Global State**: React Context for authentication and classroom selection
- **Local State**: React hooks for component-specific state
- **Form State**: React Hook Form with Zod validation

### Routing & Code Splitting

- **Client-Side Routing**: Wouter for lightweight navigation
- **Lazy Loading**: Route-based code splitting with React.lazy
- **Loading States**: Consistent loading fallbacks across routes
- **Error Boundaries**: Graceful error handling at component level

## Build & Deployment

### Development Environment

```bash
npm run dev           # Start development server with HMR
npm run check        # TypeScript compilation check
npm run db:push      # Sync database schema changes
```

### Production Build

```bash
npm run build        # Build client + server for production
npm start           # Run production server
```

### Environment Variables

**Required:**
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `JWT_SECRET`: JWT signing secret (auto-generated in dev)

**Optional:**
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 5000)
- `SENTRY_DSN`: Error tracking (optional)

### Deployment Configuration

- **Replit Integration**: Native deployment support with automatic environment detection
- **Single Port Architecture**: Frontend and API served on same port (5000)
- **Static Asset Serving**: Production mode serves pre-built client assets
- **Database Migrations**: Schema-first with `drizzle-kit push` (no manual migrations)

## Performance Optimizations

### Frontend Performance

- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Vite's native optimization with ESBuild
- **Image Optimization**: Responsive images with proper loading strategies
- **Caching Strategy**: React Query intelligent caching with background updates

### Backend Performance  

- **Database Connection Pooling**: Neon serverless automatic scaling
- **Response Compression**: Gzip compression for all responses
- **Query Optimization**: Proper indexing and efficient database queries
- **Memory Management**: Efficient garbage collection with Node.js

### Caching Strategy

- **Client-Side**: React Query cache with 30-minute GC time
- **HTTP Caching**: Appropriate cache headers for static assets
- **Database**: Connection pooling and prepared statements
- **CDN Ready**: Static assets can be served via CDN in production

## Testing Strategy

### Unit Tests (Vitest)

- **Component Testing**: React Testing Library for UI components
- **Hook Testing**: Custom hook behavior verification  
- **Utility Testing**: Pure function testing for business logic
- **API Testing**: Server route testing with Supertest

### E2E Tests (Playwright)

- **Authentication Flows**: Teacher and student login/registration
- **Core User Journeys**: Assignment creation, submission, grading
- **Role-Based Features**: Permission verification across roles
- **Cross-Browser**: Chrome, Firefox, Safari testing

### Test Organization

```
tests/
├── unit/              # Unit tests organized by component/feature
├── e2e/              # End-to-end test scenarios
├── setup.ts          # Test environment configuration
└── fixtures/         # Test data and mocks
```

## Error Handling & Monitoring

### Error Tracking

- **Sentry Integration**: Client and server error monitoring
- **Structured Logging**: Pino logger with custom log levels
- **Error Boundaries**: React error boundaries for graceful UI failure
- **API Error Handling**: Consistent error response format

### Logging Strategy

- **Development**: Pretty-printed logs with color coding
- **Production**: Structured JSON logs for log aggregation
- **Request Logging**: All API requests logged with timing and status
- **Error Context**: Full error context including user session info

## Dependencies & Security

### Critical Dependencies

**Frontend:**
- `react` (^18.3.1): Core React library
- `@tanstack/react-query` (^5.60.5): Server state management
- `@radix-ui/*`: Accessible UI primitives
- `tailwindcss` (^3.4.17): Utility-first CSS framework

**Backend:**
- `express` (^4.21.2): Web application framework
- `drizzle-orm` (^0.39.1): Type-safe SQL ORM
- `jsonwebtoken` (^9.0.2): JWT token handling
- `bcrypt` (^6.0.0): Password hashing

**Security Considerations:**
- All dependencies are pinned to specific versions
- Regular security audits via `npm audit`
- Helmet.js for security headers
- Input validation on all API endpoints

### Development Dependencies

- TypeScript 5.6.3 with strict mode enabled
- ESLint and Prettier for code quality
- Drizzle Kit for database schema management
- Vite plugins for development experience optimization

## Known Issues & Technical Debt

### Current Issues

1. **LSP Diagnostics**: 351 diagnostics in server/routes.ts (mostly type warnings)
2. **Animation Warnings**: NaN width animation errors in Progress components
3. **Duplicate Routes**: Some API routes have been duplicated and need cleanup
4. **Console Errors**: Challenges API returning 400 errors due to route conflicts

### Technical Debt Items

1. **Code Organization**: Large route files need to be split into smaller modules
2. **Type Safety**: Some `any` types need proper typing
3. **Error Handling**: Inconsistent error handling patterns across components
4. **Database Queries**: Some queries could be optimized with better indexing
5. **Testing Coverage**: E2E test coverage needs expansion

### Recommended Improvements

1. **Modularization**: Split large files (>300 lines) into focused modules
2. **Type Safety**: Eliminate remaining `any` types with proper interfaces
3. **Performance**: Add database query analysis and optimization
4. **Security**: Implement additional rate limiting for sensitive operations
5. **Documentation**: Add comprehensive API documentation with OpenAPI specs