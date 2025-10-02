import { usersReducer, usersActions, fetchUsers, updateUserStatus, type UsersState, type ListedUser } from '../../users/store/slice';

function getInitial(): UsersState {
  return {
    items: [],
    loading: false,
    error: null,
    filters: { status: 'ALL', role: 'ALL', workspace: 'ALL', project: 'ALL', query: '' },
    sort: { key: 'name', order: 'asc' },
    editing: null,
    addToWorkspacesUserId: null,
  };
}

describe('users slice', () => {
  test('setFilters merges filters', () => {
    const state = getInitial();
    const next = usersReducer(state, usersActions.setFilters({ status: 'ACTIVE', query: 'john' }));
    expect(next.filters.status).toBe('ACTIVE');
    expect(next.filters.query).toBe('john');
  });

  test('setSort updates sorting', () => {
    const state = getInitial();
    const next = usersReducer(state, usersActions.setSort({ key: 'email', order: 'desc' }));
    expect(next.sort).toEqual({ key: 'email', order: 'desc' });
  });

  test('fetchUsers.fulfilled replaces items', () => {
    const state = getInitial();
    const payload: ListedUser[] = [
      { id: '1', name: 'A', email: 'a@test.com', roles: ['MEMBER'], status: 'ACTIVE', workspaces: ['W1'], projects: [] },
      { id: '2', name: 'B', email: 'b@test.com', roles: ['ADMIN'], status: 'INACTIVE', workspaces: ['W2'], projects: [] },
    ];
    const next = usersReducer(state, { type: fetchUsers.fulfilled.type, payload });
    expect(next.items).toHaveLength(2);
    expect(next.items[0].id).toBe('1');
  });

  test('updateUserStatus.fulfilled updates single item', () => {
    const state = getInitial();
    state.items = [{ id: '1', name: 'A', email: 'a@test.com', roles: ['MEMBER'], status: 'ACTIVE' } as any];
    const updated = { id: '1', name: 'A', email: 'a@test.com', roles: ['MEMBER'], status: 'INACTIVE' } as ListedUser;
    const next = usersReducer(state, { type: updateUserStatus.fulfilled.type, payload: updated });
    expect(next.items[0].status).toBe('INACTIVE');
  });
});

import { usersReducer, usersActions, fetchUsers, updateUserStatus, type UsersState, type ListedUser } from '../../users/store/slice';

function getInitial(): UsersState {
  return {
    items: [],
    loading: false,
    error: null,
    filters: { status: 'ALL', role: 'ALL', workspace: 'ALL', project: 'ALL', query: '' },
    sort: { key: 'name', order: 'asc' },
    editing: null,
    addToWorkspacesUserId: null,
  };
}

describe('users slice', () => {
  test('setFilters merges filters', () => {
    const state = getInitial();
    const next = usersReducer(state, usersActions.setFilters({ status: 'ACTIVE', query: 'john' }));
    expect(next.filters.status).toBe('ACTIVE');
    expect(next.filters.query).toBe('john');
  });

  test('setSort updates sorting', () => {
    const state = getInitial();
    const next = usersReducer(state, usersActions.setSort({ key: 'email', order: 'desc' }));
    expect(next.sort).toEqual({ key: 'email', order: 'desc' });
  });

  test('fetchUsers.fulfilled replaces items', () => {
    const state = getInitial();
    const payload: ListedUser[] = [
      { id: '1', name: 'A', email: 'a@test.com', roles: ['MEMBER'], status: 'ACTIVE', workspaces: ['W1'], projects: [] },
      { id: '2', name: 'B', email: 'b@test.com', roles: ['ADMIN'], status: 'INACTIVE', workspaces: ['W2'], projects: [] },
    ];
    const next = usersReducer(state, { type: fetchUsers.fulfilled.type, payload });
    expect(next.items).toHaveLength(2);
    expect(next.items[0].id).toBe('1');
  });

  test('updateUserStatus.fulfilled updates single item', () => {
    const state = getInitial();
    state.items = [{ id: '1', name: 'A', email: 'a@test.com', roles: ['MEMBER'], status: 'ACTIVE' } as any];
    const updated = { id: '1', name: 'A', email: 'a@test.com', roles: ['MEMBER'], status: 'INACTIVE' } as ListedUser;
    const next = usersReducer(state, { type: updateUserStatus.fulfilled.type, payload: updated });
    expect(next.items[0].status).toBe('INACTIVE');
  });

  test('normalizes role/status casing from backend', () => {
    const state = getInitial();
    const payload: any[] = [
      { id: '1', name: 'Alice', email: 'a@x.com', roles: ['admin'], status: 'active' },
      { id: '2', name: 'Bob', email: 'b@x.com', roles: ['member'], status: 'inactive' },
    ];
    const next = usersReducer(state, { type: fetchUsers.fulfilled.type, payload });
    expect(next.items[0].roles).toContain('ADMIN');
    expect(next.items[0].status).toBe('ACTIVE');
    expect(next.items[1].roles).toContain('MEMBER');
    expect(next.items[1].status).toBe('INACTIVE');
  });
});
