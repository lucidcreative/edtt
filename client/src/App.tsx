import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import StudentManagement from "@/pages/student-management";
import Store from "@/pages/store";
import Assignments from "@/pages/assignments";
import Analytics from "@/pages/analytics";
import Announcements from "@/pages/announcements";
import TimeTracking from "@/pages/time-tracking";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

function AuthenticatedApp() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/students" component={StudentManagement} />
            <Route path="/announcements" component={Announcements} />
            <Route path="/store" component={Store} />
            <Route path="/assignments" component={Assignments} />
            <Route path="/time-tracking" component={TimeTracking} />
            <Route path="/analytics" component={Analytics} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
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
