"use client";
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import useAppSelector from '../../hooks/useAppSelector';
import { selectIsAuthenticated } from '../../../features/auth/store/selectors';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hydrated = useSelector((s: any) => s?._persist?.rehydrated);
  const router = useRouter();

  // Wait until redux-persist has rehydrated before making a redirect decision
  const ready = hydrated === true;

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated, router]);

  if (!ready) return null; // or a small loader if desired
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
