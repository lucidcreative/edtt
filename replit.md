# Classroom Economy Token Management Platform

## Overview

This is a comprehensive classroom management application that gamifies education through a digital token economy system. The platform enables teachers to create classrooms, manage students, and reward positive behavior through tokens, while students earn and spend tokens in an integrated marketplace. Built as a mobile-first progressive web application using Next.js 14, the system emphasizes educational engagement through economic simulation and peer-to-peer commerce.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with TypeScript for type safety and modern React features
- **Styling**: Tailwind CSS with mobile-first responsive design approach
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **State Management**: TanStack React Query for server state management and caching
- **Theme System**: Next-themes for dark/light mode support with system preference detection

### Backend Architecture
- **Runtime**: Node.js with Express.js for API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Build System**: Vite for fast development builds and esbuild for production bundling
- **Middleware**: Custom authentication middleware for route protection

### Authentication & Authorization
- **Provider**: Supabase Auth for secure user authentication
- **Session Management**: JWT tokens with 8-hour timeout and refresh token rotation
- **User Roles**: Role-based access control supporting teacher and student user types
- **Student Privacy**: PIN-based authentication system for students (no email required)

### Data Storage Solutions
- **Primary Database**: PostgreSQL with connection pooling for scalability
- **ORM**: Drizzle with schema definitions supporting complex relationships
- **Alternative Database**: Neon Database serverless PostgreSQL for cloud deployment
- **Schema Design**: Comprehensive relational model supporting classrooms, users, tokens, assignments, marketplace transactions

### Core Educational Features
- **Token Economy**: Digital wallet system with transaction logging and balance management
- **Assignment Management**: Link-based submission system with teacher approval workflows
- **Marketplace System**: Peer-to-peer trading platform with item listings and transaction processing
- **Request for Proposal**: Project-based assignment system where students submit proposals
- **Group Buy System**: Collaborative purchasing mechanism for classroom-wide goals
- **Analytics Dashboard**: Performance tracking and engagement metrics for teachers

### Mobile-First Design Philosophy
- **Primary Interface**: Optimized for smartphone usage during class time
- **Touch Interactions**: Large, accessible touch targets throughout the interface
- **Responsive Breakpoints**: Adaptive layouts from mobile to tablet to desktop
- **Performance**: Optimized loading states and offline capabilities where possible

## External Dependencies

### Authentication Services
- **Supabase**: Complete authentication solution with user management, session handling, and security features
- **Supabase SSR**: Server-side rendering support for authenticated routes

### Database & ORM
- **PostgreSQL**: Relational database for complex educational data relationships
- **Neon Database**: Serverless PostgreSQL alternative for cloud deployments
- **Drizzle ORM**: Type-safe database operations with migration support

### UI & Styling
- **Radix UI**: Unstyled, accessible component primitives for complex interactions
- **Tailwind CSS**: Utility-first CSS framework with mobile-first responsive design
- **Shadcn/ui**: Pre-built component library built on Radix UI primitives
- **Lucide React**: Icon library for consistent visual elements

### Development & Build Tools
- **TypeScript**: Static type checking for reduced runtime errors
- **ESBuild**: Fast JavaScript bundler for production builds
- **Vite**: Development server with hot module replacement
- **PostCSS**: CSS processing with Tailwind integration

### Error Monitoring & Analytics
- **Sentry**: Error tracking and performance monitoring for production deployments
- **TanStack React Query**: Client-side caching and synchronization for improved user experience

### Deployment Infrastructure
- **Vercel**: Optimized deployment platform for Next.js applications
- **Environment Management**: Secure environment variable handling for API keys and database connections