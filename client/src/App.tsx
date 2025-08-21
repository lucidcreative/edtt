import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";

// Wallet Page Wrapper Component
function WalletPageWrapper() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is only available to students.</p>
        </div>
      </div>
    );
  }

  const classroomId = "c108282e-9eec-432e-bc35-9c577a4ce8ce";
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <StudentWallet studentId={user.id} classroomId={classroomId} />
    </div>
  );
}

// Tokens Page Wrapper Component
function TokensPageWrapper() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is only available to teachers.</p>
        </div>
      </div>
    );
  }

  const classroomId = "c108282e-9eec-432e-bc35-9c577a4ce8ce";
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <TokenAwardInterface classroomId={classroomId} />
    </div>
  );
}
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import StudentManagement from "@/pages/student-management";
import Store from "@/pages/store";
import Assignments from "@/pages/assignments";
import Analytics from "@/pages/analytics";
import Announcements from "@/pages/announcements";
import StudentWallet from "@/components/wallet/student-wallet";
import TokenAwardInterface from "@/components/teacher/token-award-interface";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import MobileBottomNav from "@/components/navigation/mobile-bottom-nav";

function AuthenticatedApp() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden md:block">
          <Header />
        </div>
        
        {/* Main Content - Adjusted padding for mobile bottom nav */}
        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/wallet">{() => <WalletPageWrapper />}</Route>
            <Route path="/students" component={StudentManagement} />
            <Route path="/tokens">{() => <TokensPageWrapper />}</Route>
            <Route path="/announcements" component={Announcements} />
            <Route path="/store" component={Store} />
            <Route path="/assignments" component={Assignments} />
            <Route path="/analytics" component={Analytics} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
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
