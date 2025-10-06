import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import initStore from '../src/shared/store';
import { Header } from '../src/shared/components/Layout/Header';
import { authSliceActions } from '../src/features/auth/store/slice';

function Wrapper({ children }: { children: ReactNode }) {
  return <Provider store={initStore}>{children}</Provider>;
}

describe('Header', () => {
  test('shows Login and Sign Up when logged out', () => {
    render(<Header />, { wrapper: Wrapper as any });
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
  });

  test('shows avatar when logged in', async () => {
    initStore.dispatch(
      authSliceActions.setAuth({
        user: { id: '1', email: 'member@example.com', name: 'Member', roles: ['MEMBER'] },
        token: 'token',
      })
    );
    render(<Header />, { wrapper: Wrapper as any });
    expect(screen.queryByText(/Login/i)).toBeNull();
  });
});
