import reducer, { projectsActions, fetchProjects, updateProject, createProject } from '../store/slice';

function getInitial(): any {
  return {
    items: [],
    loading: false,
    error: null,
    sort: { key: 'name', dir: 'asc' },
    filters: { name: '', owner: '', workspace: '' },
    editing: null,
    statusEditingId: null,
    addNewOpen: false,
  };
}

describe('projects slice', () => {
  test('setFilter merges filters', () => {
    const state = getInitial();
    const next = reducer(state, projectsActions.setFilter({ name: 'alpha', owner: 'bob' }));
    expect(next.filters.name).toBe('alpha');
    expect(next.filters.owner).toBe('bob');
  });

  test('setSort toggles direction on same key', () => {
    const state = getInitial();
    let next = reducer(state, projectsActions.setSort({ key: 'name' }));
    expect(next.sort).toEqual({ key: 'name', dir: 'desc' });
    next = reducer(next, projectsActions.setSort({ key: 'name' }));
    expect(next.sort).toEqual({ key: 'name', dir: 'asc' });
  });

  test('fetchProjects.pending/fulfilled/rejected states', () => {
    let state = getInitial();
    state = reducer(state, { type: fetchProjects.pending.type });
    expect(state.loading).toBe(true);
    state = reducer(state, { type: fetchProjects.fulfilled.type, payload: [{ id: 'p1' }] });
    expect(state.loading).toBe(false);
    expect(state.items.length).toBe(1);
    state = reducer(state, { type: fetchProjects.rejected.type, payload: 'err' });
    expect(state.error).toBe('err');
  });

  test('updateProject.fulfilled updates item', () => {
    const state = getInitial();
    state.items = [{ id: 'p1', name: 'Old' }];
    const next = reducer(state, { type: updateProject.fulfilled.type, payload: { id: 'p1', name: 'New' } });
    expect(next.items[0]!.name).toBe('New');
  });

  test('createProject.fulfilled unshifts item', () => {
    const state = getInitial();
    state.items = [{ id: 'p1', name: 'Old' }];
    const next = reducer(state, { type: createProject.fulfilled.type, payload: { id: 'p2', name: 'New' } });
    expect(next.items[0]!.id).toBe('p2');
  });

  test('modal open/close reducers', () => {
    let state = getInitial();
    state = reducer(state, projectsActions.openAddNew());
    expect(state.addNewOpen).toBe(true);
    state = reducer(state, projectsActions.closeAddNew());
    expect(state.addNewOpen).toBe(false);

    state = reducer(state, projectsActions.openStatusEdit('p1'));
    expect(state.statusEditingId).toBe('p1');
    state = reducer(state, projectsActions.closeStatusEdit());
    expect(state.statusEditingId).toBe(null);
  });
});
