import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Activity, History as HistoryIcon, Settings, Menu, X } from "lucide-react";
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
    <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={logoImage} 
              alt="ToxiShield-X Logo" 
              className="h-6 sm:h-8 w-auto" 
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={cn(
                      "flex items-center px-1 pb-2 text-sm font-medium border-b-2 transition-colors",
                      item.current
                        ? "text-primary border-primary"
                        : "text-gray-500 hover:text-gray-700 border-transparent"
                    )}
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
              <img 
                src={gmrLogo} 
                alt="GMR Logo" 
                className="h-12 sm:h-16 w-auto"
              />
            </div>
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-sm shadow-lg border-t border-gray-200/50">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={cn(
                      "flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors",
                      item.current
                        ? "text-primary bg-primary/10"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
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
