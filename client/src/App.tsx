import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BrandingBadge } from "@/components/branding-badge";
// import { AnimatedBackground } from "@/components/animated-background";

import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin-new";
import History from "@/pages/history";

import NotFound from "@/pages/not-found";

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      {/* <AnimatedBackground /> */}
      <Header />
      <div className="flex-1 relative z-10">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/history" component={History} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
        <BrandingBadge />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
