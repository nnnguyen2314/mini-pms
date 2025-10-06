import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/store';
import projectsService, { Project } from '@/shared/services/projects';

export type SortKey = 'name' | 'owner' | 'createdAt' | 'updatedAt' | 'workspace';
export type SortDir = 'asc' | 'desc';

interface State {
  items: Project[];
  loading: boolean;
  error: string | null;
  sort: { key: SortKey; dir: SortDir };
  filters: { name: string; owner: string; workspace: string };
  editing?: Project | null;
  statusEditingId?: string | null;
  addNewOpen?: boolean;
}

const initialState: State = {
  items: [],
  loading: false,
  error: null,
  sort: { key: 'name', dir: 'asc' },
  filters: { name: '', owner: '', workspace: '' },
  editing: null,
  statusEditingId: null,
  addNewOpen: false,
};

export const fetchProjects = createAsyncThunk('projects/fetch', async (_, { rejectWithValue }) => {
  try {
    const items = await projectsService.list();
    return items;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Failed to fetch projects');
  }
});

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, patch }: { id: string; patch: Partial<Pick<Project, 'name' | 'description' | 'status' | 'workspaceId' | 'createdBy'>> }, { rejectWithValue }) => {
    try {
      const p = await projectsService.update(id, patch);
      return p;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to update project');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (payload: Partial<Pick<Project, 'name' | 'description' | 'status' | 'workspaceId' | 'createdBy'>>, { rejectWithValue }) => {
    try {
      const p = await projectsService.create(payload);
      return p;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to create project');
    }
  }
);

const slice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setSort(state, action: PayloadAction<{ key: SortKey }>) {
      const key = action.payload.key;
      state.sort = state.sort.key === key ? { key, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' };
    },
    setFilter(state, action: PayloadAction<{ name?: string; owner?: string; workspace?: string }>) {
      state.filters = { ...state.filters, ...action.payload } as any;
    },
    openEdit(state, action: PayloadAction<Project>) { state.editing = action.payload; },
    closeEdit(state) { state.editing = null; },
    openStatusEdit(state, action: PayloadAction<string>) { state.statusEditingId = action.payload; },
    closeStatusEdit(state) { state.statusEditingId = null; },
    openAddNew(state) { state.addNewOpen = true; },
    closeAddNew(state) { state.addNewOpen = false; },
  },
  extraReducers: (b) => {
    b.addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; });
    b.addCase(fetchProjects.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; });
    b.addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload as any; });

    b.addCase(updateProject.fulfilled, (state, action) => {
      const idx = state.items.findIndex(i => i.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      if (state.editing?.id === action.payload.id) state.editing = action.payload;
    });

    b.addCase(createProject.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
    });
  }
});

export const projectsActions = slice.actions;
export default slice.reducer;

export const selectProjectsState = (s: RootState) => (s as any).projects as State;
export const selectProjects = (s: RootState) => selectProjectsState(s).items;
export const selectProjectsLoading = (s: RootState) => selectProjectsState(s).loading;
export const selectProjectsSort = (s: RootState) => selectProjectsState(s).sort;
export const selectProjectsFilters = (s: RootState) => selectProjectsState(s).filters;
export const selectEditingProject = (s: RootState) => selectProjectsState(s).editing;
export const selectProjectStatusEditingId = (s: RootState) => selectProjectsState(s).statusEditingId;
export const selectAddNewProjectOpen = (s: RootState) => selectProjectsState(s).addNewOpen;