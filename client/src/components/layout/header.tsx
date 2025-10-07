import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Activity, History as HistoryIcon, Menu, X } from "lucide-react";
import logoImage from "@assets/image_1753252183678.png";
import gmrLogo from "@assets/GMR_1753253909814.webp";
import { useState } from "react";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Activity,
      current: location === "/",
    },
    {
      name: "History",
      href: "/history",
      icon: HistoryIcon,
      current: location === "/history",
    },
  ];

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <button 
                className="focus:outline-none hover:opacity-80 transition-opacity"
                style={{ border: 'none', background: 'none', padding: 0 }}
              >
                <img 
                  src={logoImage} 
                  alt="ToxiShield-X Logo" 
                  className="h-6 sm:h-8 w-auto" 
                />
              </button>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={cn(
                      "flex items-center px-1 pb-2 text-sm font-medium border-b-2 transition-all duration-300",
                      item.current
                        ? "text-primary dark:text-blue-400 border-primary"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-transparent"
                    )}
                    data-testid={`link-${item.name.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </nav>
          
          {/* Right side - GMR Logo and Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <a 
                href="https://www.gmrgroup.in/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80 focus:outline-none"
                aria-label="Visit GMR Group website"
                data-testid="link-gmr-logo"

              >
                <img 
                  src={gmrLogo} 
                  alt="GMR Logo" 
                  className="h-12 sm:h-16 w-auto"
                />
              </a>
            </div>
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl glass-button text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 glass-card shadow-xl rounded-b-2xl">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={cn(
                      "flex items-center w-full px-3 py-2 rounded-xl text-base font-medium transition-all duration-300",
                      item.current
                        ? "text-primary dark:text-blue-400 glass-button bg-primary/10"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:glass-button"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-${item.name.toLowerCase()}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
