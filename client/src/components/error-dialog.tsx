import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
}

export function ErrorDialog({ 
  isOpen, 
  onClose, 
  title = "Error", 
  message, 
  details 
}: ErrorDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800">{title}</h3>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 text-base mb-3">
            {message}
          </p>
          {details && (
            <div className="p-3 bg-gray-50 rounded border">
              <p className="text-sm text-gray-600 font-mono">{details}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end">
          <Button 
            onClick={onClose} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}