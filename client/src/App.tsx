import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ClassroomProvider } from "@/contexts/ClassroomContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Suspense, lazy } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load all page components for route-based code splitting
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const StudentManagement = lazy(() => import("@/pages/student-management"));
const Store = lazy(() => import("@/pages/store"));
const Assignments = lazy(() => import("@/pages/assignments"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Announcements = lazy(() => import("@/pages/announcements"));
const TimeTracking = lazy(() => import("@/pages/time-tracking"));
const Earn = lazy(() => import("@/pages/earn"));
const Badges = lazy(() => import("@/pages/badges"));
const Challenges = lazy(() => import("@/pages/challenges"));
const Progress = lazy(() => import("@/pages/progress"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const ChangePinPage = lazy(() => import("@/pages/change-pin"));

// Loading fallback component
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <ClassroomProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-auto pb-20 lg:pb-0">
            <Suspense fallback={<PageLoadingFallback />}>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/students" component={StudentManagement} />
                <Route path="/announcements" component={Announcements} />
                <Route path="/store" component={Store} />
                <Route path="/assignments" component={Assignments} />
                <Route path="/time-tracking" component={TimeTracking} />
                <Route path="/earn" component={Earn} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/badges" component={Badges} />
                <Route path="/challenges" component={Challenges} />
                <Route path="/progress" component={Progress} />
                <Route path="/leaderboard" component={Leaderboard} />
                <Route path="/change-pin" component={ChangePinPage} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </ClassroomProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <Switch>
        {!isAuthenticated ? (
          <Route path="*" component={AuthPage} />
        ) : (
          <Route path="*" component={AuthenticatedApp} />
        )}
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
