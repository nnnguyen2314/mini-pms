import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock ProtectedRoute to render children
jest.mock('@/shared/components/ProtectedRoute', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));

// Mock WorkspacesTable to show count of items passed
jest.mock('../components/WorkspacesTable', () => ({ __esModule: true, default: (props: any) => <div data-testid="table-count">{props.items.length}</div> }));
// Stub modals that depend on other slices to avoid unrelated selector errors
jest.mock('../components/modals/AddUsersToWorkspaceModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../components/modals/StatusModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../components/modals/EditWorkspaceModal', () => ({ __esModule: true, default: () => null }));

// Prepare a fake state consumed by selectors inside the container
const baseState: any = {
  auth: { currentUser: { id: 'u1', name: 'Admin', role: 'ADMIN' }},
  workspaces: {
    items: [
      { id: 'w1', name: 'Acme', description: null, status: 1, createdBy: 'alice', createdAt: '2024-01-01', updatedAt: '2024-01-02' },
      { id: 'w2', name: 'Beta', description: null, status: 0, createdBy: 'bob', createdAt: '2024-01-03', updatedAt: '2024-01-04' },
      { id: 'w3', name: 'Acme Tools', description: null, status: 2, createdBy: 'alice', createdAt: '2024-01-05', updatedAt: '2024-01-06' },
    ],
    loading: false,
    error: null,
    sort: { key: 'name', dir: 'asc' },
    filters: { name: '', owner: '' },
    editing: null,
    statusEditingId: null,
    addUsersWorkspaceId: null,
  }
};

// Mock useAppDispatch to capture calls
const dispatched: any[] = [];
jest.mock('@/shared/hooks/useAppDispatch', () => ({ __esModule: true, default: () => (action: any) => { dispatched.push(action); } }));

// Mock useAppSelector to call selector with our fake state
jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: (selector: any) => selector(require('./WorkspacesContainer.test.state').state) }));

// A module to export mutable state for the selector mock
jest.mock('./WorkspacesContainer.test.state', () => ({ state: { ...baseState } }), { virtual: true });

import { workspacesActions } from '../store/slice';
import WorkspacesContainer from '../containers/WorkspacesContainer';

describe('WorkspacesContainer', () => {
  beforeEach(() => { dispatched.length = 0; const st = require('./WorkspacesContainer.test.state'); st.state = JSON.parse(JSON.stringify(baseState)); });

  test('dispatches fetchWorkspaces on mount and renders all items initially', () => {
    render(<WorkspacesContainer />);
    // First dispatch should be thunk to fetch
    expect(typeof dispatched[0]).toBe('function');

    // With no filters, expect 3 items passed to table
    expect(screen.getByTestId('table-count').textContent).toBe('3');
  });

  test('typing in filters dispatches setFilter actions and filters list', () => {
    const st = require('./WorkspacesContainer.test.state');
    st.state.workspaces.filters = { name: 'acme', owner: '' };
    render(<WorkspacesContainer />);

    // With name filter 'acme', only two items should remain
    expect(screen.getByTestId('table-count').textContent).toBe('2');

    const nameInput = screen.getByLabelText('Filter by name');
    fireEvent.change(nameInput, { target: { value: 'beta' } });

    // One of the dispatched actions should be setFilter with name
    const setFilterAction = dispatched.find(a => a?.type === workspacesActions.setFilter.type);
    expect(setFilterAction).toBeTruthy();
    expect(setFilterAction.payload).toEqual({ name: 'beta' });
  });
});
