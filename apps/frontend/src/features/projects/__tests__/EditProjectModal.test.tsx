import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const editing = { id: 'p2', name: 'Beta', description: 'desc', status: 1, createdBy: 'u2', workspaceId: 'w1', createdAt: '2024-01-01', updatedAt: '2024-01-02' } as any;
const users = [ { id: 'u1', name: 'Alice', email: 'a@x.com' }, { id: 'u2', name: 'Bob', email: 'b@x.com' } ];
const workspaces = [ { id: 'w1', name: 'Acme' }, { id: 'w2', name: 'Beta WS' } ];

const dispatchMock: any = jest.fn();
dispatchMock.mockResolvedValue({});
jest.mock('@/shared/hooks/useAppDispatch', () => ({ __esModule: true, default: () => dispatchMock }));

// Selector order inside component: selectEditingProject, selectUsers, selectWorkspaces
let selectIdx = 0;
jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: () => {
  const vals = [editing, users, workspaces];
  const v = vals[selectIdx % vals.length];
  selectIdx++;
  return v;
}}));

import { projectsActions } from '../store/slice';
import EditProjectModal from '../components/modals/EditProjectModal';

describe('EditProjectModal', () => {
  beforeEach(() => { selectIdx = 0; });

  test('prefills fields and dispatches update then close on save', async () => {
    render(<EditProjectModal />);

    const name = screen.getByLabelText('Name') as HTMLInputElement;
    const desc = screen.getByLabelText('Description') as HTMLInputElement;
    expect(name.value).toBe('Beta');
    expect(desc.value).toBe('desc');

    fireEvent.change(name, { target: { value: 'Beta updated' } });

    const save = screen.getByText('Save');
    await Promise.resolve(fireEvent.click(save));

    const dispatch = require('@/shared/hooks/useAppDispatch').default() as jest.Mock;
    const calls = dispatch.mock.calls;
    expect(typeof calls[0][0]).toBe('function');
    expect(calls.find((c: any[]) => (c[0].type === projectsActions.closeEdit.type))).toBeTruthy();
  });
});
