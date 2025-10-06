import { render, screen } from '@testing-library/react';
import { DashboardMenu } from '../components/Menu';

describe('DashboardMenu', () => {
  test('renders admin links including Users and Workspaces', () => {
    render(<DashboardMenu role={'ADMIN' as any} />);
    // Workspaces chip/link
    const workspaces = screen.getByText('Workspaces');
    const wsLink = workspaces.closest('a');
    expect(wsLink).toBeTruthy();
    expect(wsLink!.getAttribute('href')).toBe('/workspaces');

    // Users chip/link only for ADMIN
    const users = screen.getByText('Users');
    const usersLink = users.closest('a');
    expect(usersLink).toBeTruthy();
    expect(usersLink!.getAttribute('href')).toBe('/users');
  });

  test('does not render Users for non-admin', () => {
    render(<DashboardMenu role={'MEMBER' as any} />);
    expect(screen.queryByText('Users')).toBeNull();
    expect(screen.getByText('Workspaces')).toBeInTheDocument();
  });
});
