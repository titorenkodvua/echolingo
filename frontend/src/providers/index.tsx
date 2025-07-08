import React from 'react';
import { QueryProvider } from './query-provider';
import { ToastProvider } from './toast-provider';
 
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryProvider>
    <ToastProvider>{children}</ToastProvider>
  </QueryProvider>
); 