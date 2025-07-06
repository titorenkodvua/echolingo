import React from 'react';
import { Toaster, toast } from 'sonner';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    {children}
    <Toaster position="top-right" richColors theme="light" />
  </>
);

export function useToast() {
  return toast;
} 