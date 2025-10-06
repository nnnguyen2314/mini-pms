import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

const users = [ { id: 'u1', name: 'Alice', email: 'a@x.com' }, { id: 'u2', name: 'Bob', email: 'b@x.com' } ];
const workspaces = [ { id: 'w1', name: 'Acme' }, { id: 'w2', name: 'Beta WS' } ];

const dispatchMock: any = jest.fn();
dispatchMock.mockResolvedValue({});
jest.mock('@/shared/hooks/useAppDispatch', () => ({ __esModule: true, default: () => dispatchMock }));

// Selector order inside component: selectAddNewProjectOpen, selectUsers, selectWorkspaces
let selectIdx = 0;
jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: () => {
  const vals = [true, users, workspaces];
  const v = vals[selectIdx % vals.length];
  selectIdx++;
  return v;
}}));

import { projectsActions } from '../store/slice';
import AddProjectModal from '../components/modals/AddProjectModal';

describe('AddProjectModal', () => {
  beforeEach(() => { selectIdx = 0; });

  test('selects workspace and owner and dispatches create then close', async () => {
    render(<AddProjectModal />);

    const wsCombo = screen.getByLabelText('Workspace');
    fireEvent.mouseDown(wsCombo);
    let listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('Acme'));

    const ownerCombo = screen.getByLabelText('Owner');
    fireEvent.mouseDown(ownerCombo);
    listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText(/Alice/));

    const add = screen.getByText('Add');
    await Promise.resolve(fireEvent.click(add));

    const dispatch = require('@/shared/hooks/useAppDispatch').default() as jest.Mock;
    const calls = dispatch.mock.calls;
    expect(typeof calls[0][0]).toBe('function');
    expect(calls.find((c: any[]) => (c[0].type === projectsActions.closeAddNew.type))).toBeTruthy();
  });
});
