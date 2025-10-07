import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BrandingBadge } from "@/components/branding-badge";
import { AnimatedWelcome } from "@/components/animated-welcome";
import { useState, useEffect } from "react";
// import { AnimatedBackground } from "@/components/animated-background";

import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import History from "@/pages/history";

import NotFound from "@/pages/not-found";

function AppContent() {
  const [showWelcome, setShowWelcome] = useState(() => {
    const hasShown = sessionStorage.getItem('welcomeShown');
    return !hasShown;
  });
  const [hasShownWelcome, setHasShownWelcome] = useState(() => {
    return !!sessionStorage.getItem('welcomeShown');
  });

  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      if (showWelcome) {
        setShowWelcome(false);
        setHasShownWelcome(true);
        sessionStorage.setItem('welcomeShown', 'true');
      }
    }, 8000);

    return () => clearTimeout(failsafeTimer);
  }, [showWelcome]);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setHasShownWelcome(true);
    sessionStorage.setItem('welcomeShown', 'true');
  };

  return (
    <>
      {showWelcome && !hasShownWelcome && (
        <AnimatedWelcome onComplete={handleWelcomeComplete} />
      )}
      <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTk5OTkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNk0yMCAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
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
    </>
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
