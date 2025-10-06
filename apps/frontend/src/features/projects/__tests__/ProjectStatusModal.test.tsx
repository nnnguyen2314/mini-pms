import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const dispatchMock: any = jest.fn();
dispatchMock.mockResolvedValue({});
jest.mock('@/shared/hooks/useAppDispatch', () => ({ __esModule: true, default: () => dispatchMock }));

jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: () => 'p1' }));

import { projectsActions } from '../store/slice';
import ProjectStatusModal from '../components/modals/ProjectStatusModal';

describe('ProjectStatusModal', () => {
  test('saving dispatches update and close', async () => {
    render(<ProjectStatusModal />);

    const archivedBtn = screen.getByText('Archived');
    fireEvent.click(archivedBtn);

    const saveBtn = screen.getByText('Save');
    await Promise.resolve(fireEvent.click(saveBtn));

    const dispatch = require('@/shared/hooks/useAppDispatch').default() as jest.Mock;
    const calls = dispatch.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(typeof calls[0][0]).toBe('function');
    expect(calls.find((c: any[]) => (c[0].type === projectsActions.closeStatusEdit.type))).toBeTruthy();
  });
});
