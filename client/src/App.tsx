import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ClassroomProvider } from "@/contexts/ClassroomContext";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import StudentManagement from "@/pages/student-management";
import Store from "@/pages/store";
import Assignments from "@/pages/assignments";
import Analytics from "@/pages/analytics";
import Announcements from "@/pages/announcements";
import TimeTracking from "@/pages/time-tracking";
import Badges from "@/pages/badges";
import Challenges from "@/pages/challenges";
import Progress from "@/pages/progress";
import ChangePinPage from "@/pages/change-pin";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";

function AuthenticatedApp() {
  return (
    <ClassroomProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-auto pb-20 lg:pb-0">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/students" component={StudentManagement} />
              <Route path="/announcements" component={Announcements} />
              <Route path="/store" component={Store} />
              <Route path="/assignments" component={Assignments} />
              <Route path="/time-tracking" component={TimeTracking} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/badges" component={Badges} />
              <Route path="/challenges" component={Challenges} />
              <Route path="/progress" component={Progress} />
              <Route path="/change-pin" component={ChangePinPage} />
              <Route component={NotFound} />
            </Switch>
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
    <Switch>
      {!isAuthenticated ? (
        <Route path="*" component={AuthPage} />
      ) : (
        <Route path="*" component={AuthenticatedApp} />
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
