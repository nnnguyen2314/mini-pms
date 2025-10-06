import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

const me = { id: 'me', name: 'Me', email: 'me@x.com' } as any;
const users = [
  me,
  { id: 'u1', name: 'Alice', email: 'a@x.com' } as any,
  { id: 'u2', name: 'Bob', email: 'b@x.com' } as any,
];

const dispatchMock: any = jest.fn();
dispatchMock.mockResolvedValue({});
jest.mock('@/shared/hooks/useAppDispatch', () => ({ __esModule: true, default: () => dispatchMock }));

// Selector order inside component: selectAddUsersWorkspaceId, selectUsers, selectCurrentUser
let selectIdx = 0;
jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: () => {
  const vals = ['w1', users, me];
  const v = vals[selectIdx % vals.length];
  selectIdx++;
  return v;
}}));

import { workspacesActions } from '../store/slice';
import AddUsersToWorkspaceModal from '../components/modals/AddUsersToWorkspaceModal';

describe('AddUsersToWorkspaceModal', () => {
  beforeEach(() => { selectIdx = 0; });

  test('excludes current user and dispatches add then close', async () => {
    render(<AddUsersToWorkspaceModal />);

    const combo = screen.getByLabelText('Users');
    // Open select menu
    fireEvent.mouseDown(combo);
    const listbox = await screen.findByRole('listbox');
    // Ensure current user not present
    expect(within(listbox).queryByText(/Me \(me@x.com\)/)).toBeNull();

    // Select Alice and Bob
    fireEvent.click(within(listbox).getByText(/Alice/));
    fireEvent.click(within(listbox).getByText(/Bob/));

    // Close menu by clicking outside label
    fireEvent.click(document.body);

    const addButton = screen.getByText('Add');
    await Promise.resolve(fireEvent.click(addButton));

    const dispatch = require('@/shared/hooks/useAppDispatch').default() as jest.Mock;
    const calls = dispatch.mock.calls;
    expect(typeof calls[0][0]).toBe('function');
    expect(calls.find((c: any[]) => (c[0].type === workspacesActions.closeAddUsers.type))).toBeTruthy();
  });
});
