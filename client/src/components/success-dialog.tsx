import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function SuccessDialog({ 
  isOpen, 
  onClose, 
  title = "Success", 
  message 
}: SuccessDialogProps) {
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
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800">{title}</h3>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 text-base">
            {message}
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end">
          <Button 
            onClick={onClose} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}