import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

jest.mock('@/shared/components/ProtectedRoute', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));

jest.mock('../components/ProjectsTable', () => ({ __esModule: true, default: (props: any) => <div data-testid="table-count">{props.items.length}</div> }));

const baseState: any = {
  auth: { currentUser: { id: 'u1', name: 'Admin', role: 'ADMIN' }},
  projects: {
    items: [
      { id: 'p1', name: 'Alpha', description: null, status: 1, createdBy: 'alice', workspaceName: 'Acme', createdAt: '2024-01-01', updatedAt: '2024-01-02' },
      { id: 'p2', name: 'Beta', description: null, status: 0, createdBy: 'bob', workspaceName: 'Beta WS', createdAt: '2024-01-03', updatedAt: '2024-01-04' },
      { id: 'p3', name: 'Alpha Tools', description: null, status: 2, createdBy: 'alice', workspaceName: 'Acme', createdAt: '2024-01-05', updatedAt: '2024-01-06' },
    ],
    loading: false,
    error: null,
    sort: { key: 'name', dir: 'asc' },
    filters: { name: '', owner: '', workspace: '' },
    editing: null,
    statusEditingId: null,
    addNewOpen: false,
  }
};

const dispatched: any[] = [];
jest.mock('@/shared/hooks/useAppDispatch', () => ({ __esModule: true, default: () => (action: any) => { dispatched.push(action); } }));

jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: (selector: any) => selector(require('./ProjectsContainer.test.state').state) }));

jest.mock('./ProjectsContainer.test.state', () => ({ state: { ...baseState } }), { virtual: true });

import { projectsActions } from '../store/slice';
import ProjectsContainer from '../containers/ProjectsContainer';

describe('ProjectsContainer', () => {
  beforeEach(() => { dispatched.length = 0; const st = require('./ProjectsContainer.test.state'); st.state = JSON.parse(JSON.stringify(baseState)); });

  test('dispatches fetchProjects on mount and renders all items initially', () => {
    render(<ProjectsContainer />);
    expect(typeof dispatched[0]).toBe('function');
    expect(screen.getByTestId('table-count').textContent).toBe('3');
  });

  test('filters list and dispatches setFilter when typing', () => {
    const st = require('./ProjectsContainer.test.state');
    st.state.projects.filters = { name: 'alpha', owner: '', workspace: '' };
    render(<ProjectsContainer />);
    expect(screen.getByTestId('table-count').textContent).toBe('2');

    const nameInput = screen.getByLabelText('Filter by name');
    fireEvent.change(nameInput, { target: { value: 'beta' } });

    const setFilterAction = dispatched.find(a => a?.type === projectsActions.setFilter.type);
    expect(setFilterAction).toBeTruthy();
    expect(setFilterAction.payload).toEqual({ name: 'beta' });
  });

  test('Add new project button dispatches openAddNew', () => {
    render(<ProjectsContainer />);
    const btn = screen.getByText('Add new project');
    fireEvent.click(btn);
    expect(dispatched.find((a) => a?.type === projectsActions.openAddNew.type)).toBeTruthy();
  });
});
