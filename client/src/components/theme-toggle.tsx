import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = theme === "dark" || (!theme && prefersDark);
    
    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full glass-button transition-all duration-300 hover:scale-105"
      aria-label="Toggle theme"
      data-testid="button-theme-toggle"
    >
      <div
        className={cn(
          "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-gradient-to-br shadow-lg transition-all duration-300 flex items-center justify-center",
          isDark 
            ? "translate-x-7 from-slate-700 to-slate-900" 
            : "translate-x-0 from-amber-400 to-orange-500"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-white" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-white" />
        )}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <Sun className={cn(
          "h-3.5 w-3.5 transition-opacity duration-300",
          isDark ? "opacity-30 text-gray-400" : "opacity-0"
        )} />
        <Moon className={cn(
          "h-3.5 w-3.5 transition-opacity duration-300",
          isDark ? "opacity-0" : "opacity-30 text-gray-400"
        )} />
      </div>
    </button>
  );
}
