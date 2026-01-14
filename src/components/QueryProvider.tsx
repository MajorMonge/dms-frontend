'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ApiClientError } from '@/lib/api-client';
import { clearAuth } from '@/store/auth';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (error instanceof ApiClientError && error.code === 'AUTH_EXPIRED') {
                return false;
              }
              // Retry once for other errors
              return failureCount < 1;
            },
          },
          mutations: {
            retry: false,
            onError: (error) => {
              // Handle auth errors globally for mutations
              if (error instanceof ApiClientError && error.code === 'AUTH_EXPIRED') {
                clearAuth();
                // Redirect will be handled by middleware/auth check
              }
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
