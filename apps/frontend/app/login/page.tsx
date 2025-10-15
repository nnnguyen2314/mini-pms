"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import useAppSelector from '../../src/shared/hooks/useAppSelector';
import { selectIsAuthenticated } from '@/features/auth/store/selectors';
import LoginContainer from '../../src/features/auth/containers/LoginContainer';

export default function Page() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hydrated = useSelector((s: unknown) => (s as { _persist?: { rehydrated?: boolean } })?._persist?.rehydrated);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [hydrated, isAuthenticated, router]);

  return <LoginContainer />;
}
