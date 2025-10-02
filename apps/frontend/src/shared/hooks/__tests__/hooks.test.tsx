import React from 'react';
import { renderWithProviders } from '@/test/test-utils';
import useAppDispatch from '../useAppDispatch';
import useAppSelector from '../useAppSelector';
import { screen } from '@testing-library/react';

function HookProbe() {
  const dispatch = useAppDispatch();
  const hasAuth = useAppSelector((s: any) => !!s.auth);
  return (
    <div>
      <div data-testid="dispatch-type">{typeof dispatch}</div>
      <div data-testid="has-auth">{String(hasAuth)}</div>
    </div>
  );
}

describe('shared hooks', () => {
  it('useAppDispatch and useAppSelector work within Providers', () => {
    renderWithProviders(<HookProbe />, { preloadedState: { auth: { token: null, user: null, error: null, loading: 'idle', isAuthenticated: false, effectiveRole: null, permissions: [] } } as any });
    expect(screen.getByTestId('dispatch-type').textContent).toBe('function');
    expect(screen.getByTestId('has-auth').textContent).toBe('true');
  });
});
