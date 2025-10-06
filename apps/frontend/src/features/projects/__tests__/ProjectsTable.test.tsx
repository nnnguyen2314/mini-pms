import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProjectsTable from '../components/ProjectsTable';
import { projectsActions } from '../store/slice';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return { ...actual, useDispatch: jest.fn() };
});

jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: () => ({ key: 'name', dir: 'asc' }) }));

const items = [
  { id: 'p1', name: 'Alpha', description: null, status: 1, createdBy: 'u1', workspaceName: 'Acme', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
  { id: 'p2', name: 'Beta', description: null, status: 0, createdBy: 'u2', workspaceName: 'Beta WS', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-02T00:00:00Z' },
];

describe('ProjectsTable', () => {
  test('renders items and dispatches sort on header click', () => {
    const dispatched: any[] = [];
    const useDispatch = require('react-redux').useDispatch as jest.Mock;
    useDispatch.mockReturnValue((action: any) => { dispatched.push(action); });

    render(<ProjectsTable items={items as any} />);

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    expect(dispatched.length).toBeGreaterThan(0);
    expect(dispatched[0]).toEqual(projectsActions.setSort({ key: 'name' }));
  });

  test('clicking status chip and edit button dispatch actions', () => {
    const dispatched: any[] = [];
    const useDispatch = require('react-redux').useDispatch as jest.Mock;
    useDispatch.mockReturnValue((action: any) => { dispatched.push(action); });

    render(<ProjectsTable items={items as any} />);

    const statusChip = screen.getByText('Active');
    fireEvent.click(statusChip);
    expect(dispatched.find(a => a.type === projectsActions.openStatusEdit.type)).toBeTruthy();

    const editButtons = screen.getAllByTitle('Edit');
    expect(editButtons.length).toBeGreaterThan(0);
    fireEvent.click(editButtons[0]!);
    expect(dispatched.find(a => a.type === projectsActions.openEdit.type)).toBeTruthy();
  });
});
