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
import backgroundImage from "@assets/generated_images/Tech_IoT_gradient_background_def028d9.png";

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
      <div 
        className="min-h-screen flex flex-col relative"
        style={{
          backgroundImage: `linear-gradient(to bottom right, rgba(224, 231, 255, 0.85), rgba(237, 233, 254, 0.85), rgba(252, 231, 243, 0.85)), url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-purple-900/95 dark:to-slate-900/95"></div>
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
