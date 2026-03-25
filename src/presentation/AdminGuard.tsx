import { ReactNode } from 'react';
import { useStore } from './store';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback = null }: AdminGuardProps) {
  const { user } = useStore();

  if (!user || !user.isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
