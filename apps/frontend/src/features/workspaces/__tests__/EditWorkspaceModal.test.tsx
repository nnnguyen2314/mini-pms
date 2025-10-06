import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const editing = { id: 'w2', name: 'Two', description: 'desc', status: 1, createdBy: 'u2', createdAt: '2024-01-01', updatedAt: '2024-01-02' } as any;

const dispatchMock: any = jest.fn();
dispatchMock.mockResolvedValue({});
jest.mock('@/shared/hooks/useAppDispatch', () => ({ __esModule: true, default: () => dispatchMock }));

jest.mock('@/shared/hooks/useAppSelector', () => ({ __esModule: true, default: () => editing }));

import { workspacesActions } from '../store/slice';
import EditWorkspaceModal from '../components/modals/EditWorkspaceModal';

describe('EditWorkspaceModal', () => {
  test('prefills fields and dispatches update then close on save', async () => {
    render(<EditWorkspaceModal />);

    const name = screen.getByLabelText('Name') as HTMLInputElement;
    const desc = screen.getByLabelText('Description') as HTMLInputElement;
    expect(name.value).toBe('Two');
    expect(desc.value).toBe('desc');

    fireEvent.change(name, { target: { value: 'Two updated' } });
    fireEvent.change(desc, { target: { value: 'more' } });

    const save = screen.getByText('Save');
    await Promise.resolve(fireEvent.click(save));

    const dispatch = require('@/shared/hooks/useAppDispatch').default() as jest.Mock;
    const calls = dispatch.mock.calls;
    expect(typeof calls[0][0]).toBe('function');
    expect(calls.find((c: any[]) => (c[0].type === workspacesActions.closeEdit.type))).toBeTruthy();
  });
});
