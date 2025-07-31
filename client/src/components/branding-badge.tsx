import { Badge } from "@/components/ui/badge";
import clinoLogoPath from "@assets/clino-logo.png";

export function BrandingBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Badge 
        variant="secondary" 
        className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg text-gray-600 px-6 py-3 rounded-full text-base font-medium hover:bg-white/95 transition-all duration-200"
      >
        <span className="text-gray-500 mr-4">Powered by</span>
        <img 
          src={clinoLogoPath} 
          alt="Clino Health" 
          className="h-8 w-auto object-contain"
        />
      </Badge>
    </div>
  );
}