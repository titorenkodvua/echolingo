/// <reference types="vite/client" />
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Devtools только в dev-режиме
const isDev = import.meta.env.MODE === 'development';

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    {isDev && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
); 