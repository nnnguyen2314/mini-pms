import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import reducers from '@/shared/store/reducers';
import UsersContainer from '../../users/containers/UsersContainer';

// Mock next/navigation router to avoid actual redirects in tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('UsersContainer guard', () => {
  test('denies non-admin users', () => {
    const store = configureStore({ reducer: reducers, preloadedState: {
      auth: { user: { id: 'u1', name: 'John', email: 'j@test.com', roles: ['MEMBER'] }, token: 't' },
      dashboard: { selectedMenu: null },
      users: undefined as any,
    } as any});
    render(
      <Provider store={store}>
        <UsersContainer />
      </Provider>
    );
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  test('renders for admin users', () => {
    const store = configureStore({ reducer: reducers, preloadedState: {
      auth: { user: { id: 'u1', name: 'Admin', email: 'a@test.com', roles: ['ADMIN'] }, token: 't' },
      dashboard: { selectedMenu: null },
      users: { items: [], loading: false, error: null, filters: { status: 'ALL', role: 'ALL', workspace: 'ALL', project: 'ALL', query: '' }, sort: { key: 'name', order: 'asc' }, editing: null, addToWorkspacesUserId: null },
    } as any});
    render(
      <Provider store={store}>
        <UsersContainer />
      </Provider>
    );
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
  });
});
