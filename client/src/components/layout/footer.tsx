import clinoLogo from "@assets/Clino logo_1753252530778.png";

export function Footer() {
  return (
    <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-200/50 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center space-x-4">
          <span className="text-sm text-gray-600">Powered by</span>
          <img 
            src={clinoLogo} 
            alt="Clino Health Logo" 
            className="h-12" 
          />
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-600">ToxiShield-X Monitoring System</span>
        </div>
      </div>
    </footer>
  );
}
