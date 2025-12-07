import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Shield, Trash2, Ban, CheckCircle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success';
  requireConfirmation?: boolean;
  confirmationWord?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'تأیید',
  cancelText = 'انصراف',
  variant = 'danger',
  requireConfirmation = false,
  confirmationWord = 'حذف',
  onConfirm,
  loading = false
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (requireConfirmation && inputValue !== confirmationWord) {
      return;
    }
    
    setIsConfirming(true);
    try {
      await onConfirm();
      setInputValue('');
      onOpenChange(false);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setInputValue('');
    }
    onOpenChange(open);
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-red-600 hover:bg-red-700';
    }
  };

  const isConfirmDisabled = requireConfirmation && inputValue !== confirmationWord;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            {getIcon()}
            <DialogTitle className="mt-4 text-xl">{title}</DialogTitle>
            <DialogDescription className="mt-2 text-gray-600">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {requireConfirmation && (
          <div className="my-4">
            <p className="text-sm text-gray-600 mb-2">
              برای تأیید، کلمه <strong className="text-red-600">{confirmationWord}</strong> را تایپ کنید:
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={confirmationWord}
              className="text-center"
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loading || isConfirming}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirmDisabled || loading || isConfirming}
            className={`flex-1 ${getButtonClass()}`}
          >
            {(loading || isConfirming) ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy usage
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'success';
    requireConfirmation: boolean;
    confirmationWord: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'danger',
    requireConfirmation: false,
    confirmationWord: 'حذف',
    onConfirm: () => {}
  });

  const confirm = (options: {
    title: string;
    description: string;
    variant?: 'danger' | 'warning' | 'success';
    requireConfirmation?: boolean;
    confirmationWord?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title: options.title,
        description: options.description,
        variant: options.variant || 'danger',
        requireConfirmation: options.requireConfirmation || false,
        confirmationWord: options.confirmationWord || 'حذف',
        onConfirm: () => resolve(true)
      });
    });
  };

  const DialogComponent = () => (
    <ConfirmDialog
      open={dialogState.open}
      onOpenChange={(open) => setDialogState(prev => ({ ...prev, open }))}
      title={dialogState.title}
      description={dialogState.description}
      variant={dialogState.variant}
      requireConfirmation={dialogState.requireConfirmation}
      confirmationWord={dialogState.confirmationWord}
      onConfirm={dialogState.onConfirm}
    />
  );

  return { confirm, DialogComponent };
}

export default ConfirmDialog;
