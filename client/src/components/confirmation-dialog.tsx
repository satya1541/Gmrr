import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, CheckCircle2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
        <div className="text-center pt-6">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center">
            {variant === "destructive" ? (
              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            )}
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 leading-relaxed whitespace-pre-line">
              {message}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex justify-center gap-4 pb-6">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="px-8 py-3 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm}
            className={variant === "destructive" 
              ? "px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              : "px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            }
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}