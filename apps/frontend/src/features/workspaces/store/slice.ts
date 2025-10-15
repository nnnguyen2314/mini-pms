import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/shared/store';
import workspacesService, { Workspace, WorkspaceStatus } from '@/shared/services/workspaces';

export type SortKey = 'name' | 'owner' | 'createdAt' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

interface State {
  items: Workspace[];
  loading: boolean;
  error: string | null;
  sort: { key: SortKey; dir: SortDir };
  filters: { name: string; owner: string };
  editing?: Workspace | null;
  statusEditingId?: string | null;
  addUsersWorkspaceId?: string | null;
}

const initialState: State = {
  items: [],
  loading: false,
  error: null,
  sort: { key: 'name', dir: 'asc' },
  filters: { name: '', owner: '' },
  editing: null,
  statusEditingId: null,
  addUsersWorkspaceId: null,
};

export const fetchWorkspaces = createAsyncThunk('workspaces/fetch', async (_, { rejectWithValue }) => {
  try {
    const items = await workspacesService.list();
    return items;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Failed to fetch workspaces');
  }
});

export const updateWorkspace = createAsyncThunk(
  'workspaces/update',
  async ({ id, patch }: { id: string; patch: Partial<Pick<Workspace, 'name' | 'description' | 'status'>> }, { rejectWithValue }) => {
    try {
      const ws = await workspacesService.update(id, patch);
      return ws;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to update workspace');
    }
  }
);

export const addUsersToWorkspace = createAsyncThunk(
  'workspaces/addUsers',
  async ({ id, userIds }: { id: string; userIds: string[] }, { rejectWithValue }) => {
    try {
      for (const userId of userIds) {
        await workspacesService.addMember(id, userId, 'MEMBER');
      }
      return { id, userIds };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to add users');
    }
  }
);

const slice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setSort(state, action: PayloadAction<{ key: SortKey }>) {
      const key = action.payload.key;
      state.sort = state.sort.key === key ? { key, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' };
    },
    setFilter(state, action: PayloadAction<{ name?: string; owner?: string }>) {
      state.filters = { ...state.filters, ...action.payload } as any;
    },
    openEdit(state, action: PayloadAction<Workspace>) {
      state.editing = action.payload;
    },
    closeEdit(state) { state.editing = null; },
    openStatusEdit(state, action: PayloadAction<string>) { state.statusEditingId = action.payload; },
    closeStatusEdit(state) { state.statusEditingId = null; },
    openAddUsers(state, action: PayloadAction<string>) { state.addUsersWorkspaceId = action.payload; },
    closeAddUsers(state) { state.addUsersWorkspaceId = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchWorkspaces.pending, (state) => { state.loading = true; state.error = null; });
    b.addCase(fetchWorkspaces.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    b.addCase(fetchWorkspaces.rejected, (state, action) => { state.loading = false; state.error = action.payload as any; });

    b.addCase(updateWorkspace.fulfilled, (state, action) => {
      const idx = state.items.findIndex(i => i.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      if (state.editing?.id === action.payload.id) state.editing = action.payload;
    });
  }
});

export const workspacesActions = slice.actions;
export default slice.reducer;

export const selectWorkspacesState = (s: RootState) => (s as any).workspaces as State;
export const selectWorkspaces = (s: RootState) => selectWorkspacesState(s)?.items;
export const selectWorkspacesLoading = (s: RootState) => selectWorkspacesState(s)?.loading;
export const selectWorkspacesSort = (s: RootState) => selectWorkspacesState(s)?.sort;
export const selectWorkspacesFilters = (s: RootState) => selectWorkspacesState(s)?.filters;
export const selectEditingWorkspace = (s: RootState) => selectWorkspacesState(s)?.editing;
export const selectStatusEditingId = (s: RootState) => selectWorkspacesState(s)?.statusEditingId;
export const selectAddUsersWorkspaceId = (s: RootState) => selectWorkspacesState(s)?.addUsersWorkspaceId;
