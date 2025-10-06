import reducer, { workspacesActions, fetchWorkspaces, updateWorkspace, type SortDir } from '../../workspaces/store/slice';
import type { Workspace } from '@/shared/services/workspaces';
import workspacesService from '@/shared/services/workspaces';

function getInitial() {
  return {
    items: [] as Workspace[],
    loading: false,
    error: null as string | null,
    sort: { key: 'name' as const, dir: 'asc' as SortDir },
    filters: { name: '', owner: '' },
    editing: null as Workspace | null,
    statusEditingId: null as string | null,
    addUsersWorkspaceId: null as string | null,
  };
}

describe('workspaces slice', () => {
  test('setFilter merges filters', () => {
    const state = getInitial();
    const next = reducer(state as any, workspacesActions.setFilter({ name: 'Acme', owner: 'alice' }));
    expect(next.filters).toEqual({ name: 'Acme', owner: 'alice' });
  });

  test('setSort toggles direction when same key is set again', () => {
    const state = getInitial();
    // first time set to createdAt -> asc
    let next = reducer(state as any, workspacesActions.setSort({ key: 'createdAt' }));
    expect(next.sort).toEqual({ key: 'createdAt', dir: 'asc' });
    // set again -> desc
    next = reducer(next as any, workspacesActions.setSort({ key: 'createdAt' }));
    expect(next.sort).toEqual({ key: 'createdAt', dir: 'desc' });
    // switch to another key resets to asc
    next = reducer(next as any, workspacesActions.setSort({ key: 'updatedAt' }));
    expect(next.sort).toEqual({ key: 'updatedAt', dir: 'asc' });
  });

  test('open/close edit modal', () => {
    const state = getInitial();
    const ws: Workspace = { id: 'w1', name: 'W1', createdBy: 'u1', createdAt: '2024-01-01', updatedAt: '2024-01-02', description: null, status: 1 };
    let next = reducer(state as any, workspacesActions.openEdit(ws));
    expect(next.editing).toEqual(ws);
    next = reducer(next as any, workspacesActions.closeEdit());
    expect(next.editing).toBeNull();
  });

  test('open/close status edit id', () => {
    const state = getInitial();
    let next = reducer(state as any, workspacesActions.openStatusEdit('w2'));
    expect(next.statusEditingId).toBe('w2');
    next = reducer(next as any, workspacesActions.closeStatusEdit());
    expect(next.statusEditingId).toBeNull();
  });

  test('open/close add users', () => {
    const state = getInitial();
    let next = reducer(state as any, workspacesActions.openAddUsers('w3'));
    expect(next.addUsersWorkspaceId).toBe('w3');
    next = reducer(next as any, workspacesActions.closeAddUsers());
    expect(next.addUsersWorkspaceId).toBeNull();
  });

  test('fetchWorkspaces pending/fulfilled/rejected updates flags and items', () => {
    const state = getInitial();
    let next = reducer(state as any, { type: fetchWorkspaces.pending.type });
    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();

    const payload: Workspace[] = [
      { id: 'w1', name: 'One', description: null, status: 1, createdBy: 'u1', createdAt: '2024-01-01', updatedAt: '2024-01-02' },
      { id: 'w2', name: 'Two', description: 'x', status: 0, createdBy: 'u2', createdAt: '2024-01-03', updatedAt: '2024-01-04' },
    ];
    next = reducer(next as any, { type: fetchWorkspaces.fulfilled.type, payload });
    expect(next.loading).toBe(false);
    expect(next.items).toHaveLength(2);

    next = reducer(next as any, { type: fetchWorkspaces.rejected.type, payload: 'boom' });
    expect(next.loading).toBe(false);
    expect(next.error).toBe('boom');
  });

  test('updateWorkspace.fulfilled replaces item and editing when ids match', () => {
    const state = getInitial();
    state.items = [
      { id: 'w1', name: 'One', description: null, status: 1, createdBy: 'u1', createdAt: '2024-01-01', updatedAt: '2024-01-02' },
      { id: 'w2', name: 'Two', description: 'x', status: 0, createdBy: 'u2', createdAt: '2024-01-03', updatedAt: '2024-01-04' },
    ];
    state.editing = state.items[1]!;

    const updated: Workspace = { id: 'w2', name: 'Two updated', description: 'y', status: 2, createdBy: 'u2', createdAt: '2024-01-03', updatedAt: '2024-02-01' };
    const next = reducer(state as any, { type: updateWorkspace.fulfilled.type, payload: updated });
    expect(next.items[1]).toEqual(updated);
    expect(next.editing).toEqual(updated);
  });
});

describe('workspaces service helpers', () => {
  test('statusToName maps numeric statuses to names', () => {
    // Access via the service to ensure export is wired
    const map = [
      { s: 1 as const, n: 'Active' },
      { s: 2 as const, n: 'Archived' },
      { s: 0 as const, n: 'Inactive' },
      { s: null as any, n: 'Unknown' },
      { s: undefined as any, n: 'Unknown' },
    ];
    for (const { s, n } of map) {
      // @ts-ignore access internal via any to call helper
      const name = (workspacesService as any).statusToName(s);
      expect(name).toBe(n);
    }
  });
});
