import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import WorkspacesTable from '../components/WorkspacesTable';
import { workspacesActions } from '../store/slice';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return { ...actual, useDispatch: jest.fn() };
});

jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: () => ({ key: 'name', dir: 'asc' }) }));

const items = [
  { id: 'w1', name: 'One', description: null, status: 1, createdBy: 'u1', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
  { id: 'w2', name: 'Two', description: null, status: 0, createdBy: 'u2', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-02T00:00:00Z' },
];

describe('WorkspacesTable', () => {
  test('renders items and dispatches sort on header click', () => {
    const dispatched: any[] = [];
    const useDispatch = require('react-redux').useDispatch as jest.Mock;
    useDispatch.mockReturnValue((action: any) => { dispatched.push(action); });

    render(<WorkspacesTable items={items as any} />);

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    expect(dispatched.length).toBeGreaterThan(0);
    expect(dispatched[0]).toEqual(workspacesActions.setSort({ key: 'name' }));
  });

  test('clicking status chip and action buttons dispatch proper actions', () => {
    const dispatched: any[] = [];
    const useDispatch = require('react-redux').useDispatch as jest.Mock;
    useDispatch.mockReturnValue((action: any) => { dispatched.push(action); });

    render(<WorkspacesTable items={items as any} />);

    // status chip for first row
    const statusChip = screen.getByText('Active');
    fireEvent.click(statusChip);
    expect(dispatched.find(a => a.type === workspacesActions.openStatusEdit.type)).toBeTruthy();

    // edit button
    const editButtons = screen.getAllByTitle('Edit');
    expect(editButtons.length).toBeGreaterThan(0);
    fireEvent.click(editButtons[0]!);
    expect(dispatched.find(a => a.type === workspacesActions.openEdit.type)).toBeTruthy();

    // add users button
    const addButtons = screen.getAllByTitle('Add users');
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]!);
    expect(dispatched.find(a => a.type === workspacesActions.openAddUsers.type)).toBeTruthy();
  });
});
