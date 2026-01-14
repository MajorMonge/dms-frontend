'use client';

import { useAuthSync } from '@/hooks/useAuth';
import { ReactNode } from 'react';

/**
 * Auth synchronization component
 * Keeps cookies in sync with auth store for middleware access
 */
export function AuthSync({ children }: { children: ReactNode }) {
  useAuthSync();
  return <>{children}</>;
}
