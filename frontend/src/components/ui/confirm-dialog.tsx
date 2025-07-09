import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-error',
          confirmButton: 'btn-error'
        };
      case 'warning':
        return {
          icon: 'text-warning', 
          confirmButton: 'btn-warning'
        };
      case 'info':
        return {
          icon: 'text-info',
          confirmButton: 'btn-info'
        };
      default:
        return {
          icon: 'text-error',
          confirmButton: 'btn-error'
        };
    }
  };

  const classes = getVariantClasses();

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className={`w-6 h-6 ${classes.icon}`} />
          <h3 className="text-lg font-semibold text-base-content">{title}</h3>
          <button
            onClick={onCancel}
            className="ml-auto btn btn-ghost btn-sm btn-circle"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-base-content opacity-80">{message}</p>
        </div>

        {/* Actions */}
        <div className="modal-action">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant="error"
            onClick={onConfirm}
            loading={isLoading}
            className={classes.confirmButton}
          >
            {confirmText}
          </Button>
        </div>
      </div>
      
      {/* DaisyUI backdrop */}
      <div className="modal-backdrop" onClick={onCancel}>
        <button>close</button>
      </div>
    </div>
  );
}; 