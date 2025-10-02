"use client";
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import useAppSelector from '../../hooks/useAppSelector';
import { selectIsAuthenticated } from '../../../features/auth/store/selectors';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
