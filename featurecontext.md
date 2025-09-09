# BizCoin Educational Platform - Feature Context

## Platform Overview

BizCoin is a comprehensive educational platform that gamifies classroom management through a token economy system. Teachers create and manage classrooms where students earn tokens by completing assignments and can spend tokens in virtual stores. The platform emphasizes engagement through badges, challenges, and leaderboards while providing robust analytics for educators.

## User Roles & Permissions

### Teacher Role
**Authentication**: Email + Password
**Core Capabilities**:
- Full classroom management (create, configure, delete)
- Assignment creation, editing, and grading
- Student roster management and approval
- Token awarding and economy management
- Store item creation and pricing
- Badge and challenge system management
- Analytics and progress monitoring
- Announcement creation and scheduling

**Access Control**: Teachers can only manage their own classrooms and cannot access other teachers' data.

### Student Role  
**Authentication**: Nickname + PIN
**Core Capabilities**:
- Join classrooms via join codes
- View and submit assignments
- Earn tokens through completion
- Shop in classroom store
- Track personal progress and badges
- View leaderboards and challenges
- Receive announcements

**Access Control**: Students can only access classrooms they're enrolled in and cannot create or delete content.

## Core Features

### 1. Authentication System

**Teacher Registration/Login**
- Location: `/auth` route, `client/src/pages/auth.tsx`
- Flow: Email validation → Password requirements → Email verification → Account approval
- Security: bcrypt password hashing, JWT tokens with 8-hour expiration
- Recovery: Password reset via email (planned feature)

**Student Registration/Login**  
- Location: Same auth page with role toggle
- Flow: Nickname selection → PIN creation → Classroom joining
- Security: PIN encryption, account lockout after failed attempts
- Constraints: Students cannot register without joining a classroom

**Session Management**
- JWT tokens stored in localStorage
- Automatic token refresh on page load
- Role-based route protection via `useAuth` hook
- Logout functionality with token cleanup

### 2. Classroom Management

**Classroom Creation** (Teachers)
- Location: Dashboard → Create Classroom modal
- Required Fields: Name, subject, grade level
- Generated: Unique 6-character join code
- Settings: Auto-approval, token rates, time tracking options
- File: `client/src/components/classroom/create-classroom-modal.tsx`

**Joining Classrooms** (Students)
- Location: Join modal from student dashboard  
- Flow: Enter join code → Request enrollment → Teacher approval (if required)
- Auto-approval: Configurable per classroom
- File: `client/src/components/student/join-classroom-modal.tsx`

**Roster Management** (Teachers)
- Location: `/students` route
- Capabilities: View all students, approve pending enrollments, remove students
- Bulk operations: Mass approval/rejection of enrollment requests
- File: `client/src/pages/student-management.tsx`

### 3. Assignment System

**Assignment Creation** (Teachers)
- Location: `/assignments` route → Create Assignment button
- Form Fields: Title, description, category, token reward, due date
- Advanced Features: Learning objectives, submission requirements, grading rubrics
- Launch Options: Immediate, scheduled, or manual activation
- File: `client/src/components/teacher/assignment-creator.tsx`

**Assignment Management** (Teachers)
- View all classroom assignments in grid/list view
- Filter by category, status, due date
- Edit existing assignments (title, description, rewards)
- Delete assignments (with confirmation)
- Bulk operations for multiple assignments

**Assignment Submission** (Students)
- Location: Student dashboard → Assignment cards
- Submission Types: Text, file upload, external links
- Progress Tracking: Draft saving, submission status
- Resubmission: Configurable per assignment
- File: `client/src/components/submission/SubmissionForm.tsx`

**Grading System** (Teachers)
- View all submissions for an assignment
- Rubric-based grading with point allocation
- Written feedback and token awarding
- Grade book integration with progress tracking

### 4. RFP (Request for Proposal) System

**RFP Creation** (Teachers)
- Location: `/proposals` route
- Purpose: Special project-based assignments
- Fields: Project scope, requirements, budget constraints, deliverables
- Automatic Creation: All RFPs are immediately active and class-wide
- File: `client/src/pages/proposals-portal.tsx`

**Proposal Submission** (Students)
- Students submit detailed project proposals
- Include timeline, milestones, resource requirements
- Progress tracking throughout project lifecycle

**Proposal Management** (Teachers)
- Review and approve/reject proposals
- Provide feedback and request revisions
- Track project progress and milestone completion
- Award final tokens based on completion quality

### 5. Token Economy System

**Token Earning**
- Primary: Assignment completion (base tokens + bonuses)
- Secondary: Badge achievements, challenge completion
- Optional: Time tracking (configurable rate per hour)
- Bonuses: Early submission, quality work, participation

**Token Spending**
- Virtual store items (supplies, privileges, experiences)
- Special events or classroom auctions
- Custom rewards created by teachers

**Transaction History**
- All token movements tracked and auditable
- Student wallet shows current balance and history
- Teacher dashboard shows classroom economy overview
- File: `client/src/components/wallet/student-wallet.tsx`

### 6. Store System

**Store Management** (Teachers)
- Location: `/store` route → Teacher view
- Item Creation: Name, description, token cost, quantity, category
- Inventory Management: Stock tracking, restocking alerts
- Templates: Pre-built item templates for quick setup
- File: `client/src/components/store/teacher-store-management.tsx`

**Shopping Experience** (Students)
- Location: `/store` route → Student view
- Features: Browse by category, search items, wishlist functionality
- Purchase Flow: Add to cart → Confirm purchase → Balance deduction
- Purchase History: Track all transactions and items received
- File: `client/src/components/store/student-shopping-experience.tsx`

### 7. Badge System

**Badge Management** (Teachers)
- Location: Integrated in `/leaderboard` → Badges tab
- Creation: Custom badges with icons, descriptions, criteria
- Templates: Pre-built achievement templates
- Award System: Manual awarding or automatic triggers
- Analytics: Track badge distribution and engagement

**Badge Earning** (Students)
- Automatic: Triggered by assignment completion, streaks, milestones
- Manual: Teacher-awarded for exceptional work
- Display: Badge collection visible on profile and leaderboard
- Progress: Visual indicators for badge requirements

### 8. Challenge System

**Challenge Creation** (Teachers)
- Location: `/leaderboard` → Challenges tab (integrated with badges)
- Types: Individual, team, or classroom-wide challenges
- Criteria: Token goals, assignment completion, time-based objectives
- Duration: Set start/end dates for time-bound challenges

**Challenge Participation** (Students)
- View active challenges and progress
- Compete individually or collaborate in teams
- Real-time progress tracking and leaderboard updates
- Celebration of challenge completion

### 9. Leaderboard System

**Teacher Leaderboard Dashboard**
- Location: `/teacher-leaderboard` (comprehensive teacher interface)
- Tabs: Overview, Badges, Challenges, Analytics
- Features: Student rankings, award interface, badge/challenge management
- Real-time: Live updates as students earn tokens and badges

**Student Progress View**
- Location: Multiple locations (dashboard, progress page)
- Personal ranking within classroom
- Comparison with peers (anonymous options)
- Achievement showcases and milestone tracking

### 10. Analytics Dashboard

**Teacher Analytics**
- Location: `/analytics` route  
- Metrics: Student engagement, assignment completion rates, token distribution
- Visualizations: Charts for progress over time, category breakdowns
- Reports: Exportable data for grade books and parent communication

**Time Tracking Analytics** (Optional Feature)
- Location: `/time-tracking` route
- Metrics: Time spent per student, productivity patterns
- Integration: Token earning based on logged time
- Reporting: Time reports for accountability

### 11. Announcements System

**Announcement Creation** (Teachers)
- Location: `/announcements` route
- Features: Rich text editor, scheduling, priority levels
- Distribution: Class-wide or targeted to specific students
- Templates: Reusable announcement formats

**Announcement Viewing** (Students)
- Dashboard integration with recent announcements
- Notification system for new announcements
- Archive of past announcements for reference

## User Interface Design

### Mobile-First Approach

**Responsive Breakpoints**:
- Mobile: 0-768px (primary design target)
- Tablet: 768-1024px
- Desktop: 1024px+

**Navigation Patterns**:
- Mobile: Bottom navigation bar with core features
- Desktop: Sidebar navigation with expanded options
- Consistent header across all screen sizes

**Component Design**:
- Card-based layouts for content organization
- Touch-friendly buttons and interactive elements
- Optimized forms for mobile input
- Progressive disclosure for complex features

### Design System

**Colors**: 
- Primary: Blue gradient (blue-600 to purple-600)
- Success: Green variants for positive actions
- Warning: Amber for alerts and attention
- Error: Red variants for errors and destructive actions

**Typography**: 
- Clean, readable fonts optimized for educational content
- Hierarchy established through size and weight
- Accessibility compliant contrast ratios

**Components**:
- Radix UI primitives for accessibility
- Custom components built with Tailwind CSS
- Consistent spacing and sizing system
- Animation and transition guidelines

## User Flows

### Teacher Onboarding Flow
1. Registration with email verification
2. First classroom creation with setup wizard
3. Student invitation via join codes
4. First assignment creation tutorial
5. Store setup and token economy configuration

### Student Onboarding Flow  
1. Registration with nickname and PIN
2. Classroom joining via join code
3. Profile setup and customization
4. First assignment submission tutorial
5. Store and badge system introduction

### Daily Usage Patterns

**Teachers**:
1. Dashboard review (pending submissions, announcements)
2. Assignment grading and feedback
3. Progress monitoring via analytics
4. Student communication and support

**Students**:
1. Dashboard check for new assignments
2. Assignment work and submission
3. Progress tracking and badge collection
4. Store browsing and token spending

## Edge Cases & Error Handling

### Authentication Edge Cases
- Password reset for forgotten passwords
- PIN reset for students (teacher-initiated)
- Session expiration during active work
- Multiple device login handling

### Classroom Management Edge Cases
- Duplicate join code generation (extremely rare)
- Student removal with active assignments
- Classroom deletion with enrolled students
- Teacher account deactivation scenarios

### Assignment System Edge Cases
- Late submission handling and penalties
- Assignment deletion with existing submissions
- Due date changes affecting submitted work
- Grading disputes and revision requests

### Token Economy Edge Cases
- Negative token balance scenarios
- Token adjustment for grading corrections
- Store item unavailability after purchase
- Refund policies for virtual items

### Technical Error Scenarios
- Network connectivity issues during submissions
- File upload failures and recovery
- Database connection failures
- Third-party service outages (file storage, email)

## Acceptance Criteria

### Performance Requirements
- Page load times < 3 seconds on mobile networks
- Form submissions < 1 second response time
- Real-time updates < 500ms latency
- File uploads support up to 10MB

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios > 4.5:1

### Security Requirements
- Password complexity enforcement
- Account lockout after failed attempts
- Data encryption in transit and at rest
- Role-based access control verification

### Mobile Experience Requirements
- Touch-friendly interface (44px minimum tap targets)
- Offline capability for viewing content
- Progressive web app features
- Native app-like navigation patterns

## Feature Mapping to Code Locations

### Authentication
- Frontend: `client/src/pages/auth.tsx`, `client/src/hooks/useAuth.ts`
- Backend: `server/routes.ts` (auth endpoints), `server/middleware/auth.ts`

### Classroom Management  
- Frontend: `client/src/components/classroom/`, `client/src/pages/student-management.tsx`
- Backend: `server/routes.ts` (classroom endpoints), `server/storage.ts` (classroom methods)

### Assignment System
- Frontend: `client/src/components/teacher/assignment-creator.tsx`, `client/src/pages/assignments.tsx`
- Backend: `server/routes.ts` (assignment endpoints), assignment resource management routes

### Token Economy
- Frontend: `client/src/components/wallet/`, token award interfaces
- Backend: Token transaction routes, balance management in storage layer

### Gamification (Badges/Challenges)
- Frontend: `client/src/pages/enhanced-badges.tsx`, `client/src/pages/enhanced-challenges.tsx`
- Backend: Badge/challenge routes in `server/routes.ts`

### Analytics
- Frontend: `client/src/pages/analytics.tsx`, dashboard components
- Backend: `server/routes/analytics.ts`, time tracking routes

This feature documentation provides the complete functional context for developers to understand user flows, business logic, and implementation requirements across the BizCoin educational platform.