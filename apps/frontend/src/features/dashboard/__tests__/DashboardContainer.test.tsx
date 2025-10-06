import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('@/shared/components/ProtectedRoute', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock('@/features/auth/store/selectors', () => ({
  __esModule: true,
  selectCurrentUser: () => ({ id: 'u1', name: 'Admin User', role: 'ADMIN' }),
  selectIsAdmin: () => true,
}));
jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: (selector: any) => selector({} as any) }));

import DashboardContainer from '../containers/DashboardContainer';

describe('DashboardContainer', () => {
  test('renders Dashboard header and menu for admin', () => {
    render(<DashboardContainer />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Admin User!')).toBeInTheDocument();
    expect(screen.getByText('Workspaces')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});
