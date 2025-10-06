import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const dispatchMock: any = jest.fn();
dispatchMock.mockResolvedValue({});
jest.mock('@/shared/hooks/useAppDispatch', () => ({ __esModule: true, default: () => dispatchMock }));

jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: () => 'w1' }));

import { workspacesActions } from '../store/slice';
import StatusModal from '../components/modals/StatusModal';

describe('StatusModal', () => {
  test('saving dispatches update and close', async () => {
    render(<StatusModal />);

    // choose Archived
    const archivedBtn = screen.getByText('Archived');
    fireEvent.click(archivedBtn);

    const saveBtn = screen.getByText('Save');
    await Promise.resolve(fireEvent.click(saveBtn));

    const dispatch = require('@/shared/hooks/useAppDispatch').default() as jest.Mock;
    // first call with thunk function, later close action
    const calls = dispatch.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(typeof calls[0][0]).toBe('function');
    expect(calls.find((c: any[]) => (c[0].type === workspacesActions.closeStatusEdit.type))).toBeTruthy();
  });
});
