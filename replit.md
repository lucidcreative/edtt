# BizCoin Classroom Token Economy Platform

## Overview

BizCoin is a comprehensive mobile-first educational platform designed to gamify classroom management through a digital token economy system. The application serves as a classroom management tool where teachers can create assignments, manage students, operate virtual stores, and track analytics while students earn tokens through completed assignments and can spend them in the classroom store.

The platform is built as a full-stack React application with TypeScript, featuring a modern, responsive design optimized for mobile devices used in classroom environments. The system supports role-based authentication for teachers and students, with teachers having full administrative capabilities and students accessing a simplified interface focused on earning and spending tokens.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Styling**: Tailwind CSS with mobile-first responsive design approach using custom color variables and themes
- **UI Components**: Radix UI primitives integrated through shadcn/ui component library for accessible, customizable components
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Animation**: Framer Motion for smooth UI transitions and micro-interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Language**: TypeScript throughout for consistency and type safety
- **Authentication**: JWT token-based authentication with 8-hour session timeout
- **Security**: bcrypt for password hashing with 12+ rounds, separate PIN encryption for students
- **API Design**: RESTful endpoints organized by resource with proper error handling middleware

### Data Storage Solutions
- **Database**: PostgreSQL as the primary database with Neon serverless hosting
- **ORM**: Drizzle ORM with type-safe schema definitions and migrations
- **Schema Design**: Role-based user system supporting teachers and students with different authentication methods
- **Connection Pooling**: Neon serverless connection pooling for scalable database access

### Authentication and Authorization
- **Multi-Role System**: Teachers authenticate with email/password, students with nickname/PIN
- **Session Management**: JWT tokens with configurable expiration (default 8 hours)
- **Registration Flow**: Email verification for teachers, classroom code-based joining for students
- **Security Features**: Login attempt tracking, account lockout, and approval workflows

### Component Architecture
- **Layout System**: Responsive sidebar navigation with collapsible mobile menu
- **Page Structure**: Dashboard-driven interface with dedicated pages for student management, assignments, store, and analytics
- **Reusable Components**: Modular dashboard widgets for metrics, leaderboards, badges, and progress tracking
- **Form Handling**: React Hook Form integration with Zod validation schemas

### File Organization
- **Monorepo Structure**: Shared schema definitions between client and server
- **Path Aliases**: TypeScript path mapping for clean imports (@, @shared, @assets)
- **Asset Management**: Centralized asset handling with Vite build optimization
- **Component Structure**: Organized UI components with separation of business logic and presentation

## External Dependencies

### Cloud Services
- **Database**: Neon serverless PostgreSQL for scalable database hosting
- **File Storage**: Google Cloud Storage for handling file uploads and assets
- **Development**: Replit integration with development tooling and hot reload

### Core Libraries
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, TanStack React Query
- **Backend**: Express.js, Drizzle ORM, bcrypt, jsonwebtoken
- **UI Components**: Radix UI primitives, Lucide React icons, shadcn/ui components
- **Development**: Vite build system, ESBuild for production builds, TSX for development server

### Authentication & Security
- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: jsonwebtoken for stateless authentication
- **Input Validation**: Zod schemas for runtime type checking and validation
- **CORS**: Express CORS middleware for cross-origin request handling

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Database Migration**: Drizzle Kit for schema migrations and database management
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Asset Optimization**: PostCSS with Autoprefixer for CSS processing