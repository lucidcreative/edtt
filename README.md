# BizCoin Classroom Token Economy Platform

A comprehensive educational classroom management platform with a token-based economy system, featuring proposals portal, badges, challenges, and teacher management tools.

## Features

- **Role-based Authentication**: Separate interfaces for teachers and students
- **Token Economy**: Students earn tokens through assignments and activities
- **Proposals Portal**: Students can submit project proposals, teachers can review and select winners
- **Classroom Management**: Teachers can manage students, assignments, and track progress
- **Responsive Design**: Mobile-first approach optimized for classroom environments
- **Real-time Updates**: Live notifications and progress tracking

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account and project

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bizcoin-classroom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Database**
   
   Create the following tables in your Supabase project:

   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email TEXT UNIQUE,
     username TEXT UNIQUE,
     role TEXT CHECK (role IN ('teacher', 'student', 'admin')) DEFAULT 'student',
     password_hash TEXT,
     pin_hash TEXT,
     nickname TEXT,
     first_name TEXT,
     last_name TEXT,
     profile_image_url TEXT,
     token_balance INTEGER DEFAULT 0,
     total_tokens_earned INTEGER DEFAULT 0,
     total_tokens_spent INTEGER DEFAULT 0,
     streak_count INTEGER DEFAULT 0,
     last_activity TIMESTAMP WITH TIME ZONE,
     settings JSONB,
     is_active BOOLEAN DEFAULT true,
     email_verified BOOLEAN DEFAULT false,
     phone_number TEXT,
     emergency_contact TEXT,
     grade_level TEXT,
     date_of_birth DATE,
     parent_email TEXT,
     preferred_language TEXT DEFAULT 'en',
     accessibility_needs TEXT,
     learning_style TEXT,
     bio TEXT,
     social_links JSONB,
     achievements TEXT[],
     last_login TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Classrooms table
   CREATE TABLE classrooms (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
     subject TEXT,
     grade_level TEXT,
     classroom_code TEXT UNIQUE NOT NULL,
     max_students INTEGER,
     is_active BOOLEAN DEFAULT true,
     settings JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Assignments table
   CREATE TABLE assignments (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     type TEXT NOT NULL,
     classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
     teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
     student_id UUID REFERENCES users(id) ON DELETE SET NULL,
     due_date TIMESTAMP WITH TIME ZONE,
     token_reward INTEGER DEFAULT 0,
     status TEXT DEFAULT 'active',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Proposals table
   CREATE TABLE proposals (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
     student_id UUID REFERENCES users(id) ON DELETE CASCADE,
     title TEXT,
     content TEXT NOT NULL,
     status TEXT DEFAULT 'draft',
     priority TEXT DEFAULT 'medium',
     progress_percentage INTEGER DEFAULT 0,
     milestones TEXT[],
     completed_milestones TEXT[],
     teacher_feedback TEXT,
     submitted_at TIMESTAMP WITH TIME ZONE,
     approved_at TIMESTAMP WITH TIME ZONE,
     is_winner BOOLEAN DEFAULT false,
     selected_at TIMESTAMP WITH TIME ZONE,
     selected_by UUID REFERENCES users(id),
     project_budget INTEGER,
     payment_type TEXT,
     escrow_status TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
   ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

   -- Create policies (basic examples - customize as needed)
   CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Teachers can view their classrooms" ON classrooms FOR SELECT USING (auth.uid() = teacher_id);
   CREATE POLICY "Students can view their proposals" ON proposals FOR SELECT USING (auth.uid() = student_id);
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Deployment on Vercel

1. **Push your code to GitHub**

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project

3. **Configure Environment Variables**
   
   In your Vercel project settings, add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional, for server-side operations)

4. **Deploy**
   - Vercel will automatically build and deploy your application
   - Your app will be available at `https://your-project-name.vercel.app`

## Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── proposals/         # Proposals pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # React providers
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   ├── proposals/         # Proposal components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase configuration
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions and constants
└── middleware.ts          # Next.js middleware
```

## Key Features

### Authentication
- Teachers: Email/password authentication
- Students: Nickname/PIN authentication with classroom codes
- Role-based access control

### Dashboard
- Overview of tokens, achievements, and progress
- Quick actions for common tasks
- Recent activity feed

### Proposals Portal
- Students can submit project proposals
- Teachers can review and select winners
- Progress tracking and milestone management
- Escrow system for token payments

### Token Economy
- Students earn tokens through assignments
- Token balance tracking
- Streak counters and achievements

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email your-email@example.com or create an issue in the GitHub repository.