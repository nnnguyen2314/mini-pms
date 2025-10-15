import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/store';
import type { Role } from '@/shared/types/auth';
import usersService, { UpdateUserPayload } from '@/shared/services/users';
import { normalizeStatus } from '../misc/status';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED' | 'REACTIVATED';

export interface ListedUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  workspaces?: string[]; // names for simplicity
  projects?: string[]; // names for simplicity
}

export interface FiltersState {
  status?: UserStatus | 'ALL';
  workspace?: string | 'ALL';
  project?: string | 'ALL';
  role?: Role | 'ALL';
  query?: string;
}

export type SortKey = 'name' | 'email' | 'workspaces' | 'projects' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface UsersState {
  items: ListedUser[];
  loading: boolean;
  error?: string | null;
  filters: FiltersState;
  sort: { key: SortKey; order: SortOrder };
  editing?: ListedUser | null;
  addToWorkspacesUserId?: string | null;
}

const initialState: UsersState = {
  items: [],
  loading: false,
  error: null,
  filters: { status: 'ALL', role: 'ALL', workspace: 'ALL', project: 'ALL', query: '' },
  sort: { key: 'name', order: 'asc' },
  editing: null,
  addToWorkspacesUserId: null,
};

export const fetchUsers = createAsyncThunk('users/fetch', async (_, { rejectWithValue }) => {
  try {
    const users = await usersService.list();
    return users;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load users';
    return rejectWithValue(message);
  }
});

export const updateUserStatus = createAsyncThunk(
  'users/updateStatus',
  async ({ userId, status }: { userId: string; status: UserStatus }, { rejectWithValue }) => {
    try {
      const user = await usersService.updateStatus(userId, status);
      return user;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update status';
      return rejectWithValue(message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async (payload: UpdateUserPayload, { rejectWithValue }) => {
    try {
      const user = await usersService.update(payload);
      return user;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update user';
      return rejectWithValue(message);
    }
  }
);

export const addUserToWorkspaces = createAsyncThunk(
  'users/addToWorkspaces',
  async ({ userId, workspaceIds }: { userId: string; workspaceIds: string[] }, { rejectWithValue }) => {
    try {
      const user = await usersService.addToWorkspaces(userId, workspaceIds);
      return user;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add to workspaces';
      return rejectWithValue(message);
    }
  }
);

const slice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<FiltersState>>) {
      state.filters = { ...state.filters, ...action.payload };
    }
    ,
    setSort(state, action: PayloadAction<UsersState['sort']>) {
      state.sort = action.payload;
    },
    openEdit(state, action: PayloadAction<string | ListedUser>) {
      const id = typeof action.payload === 'string' ? action.payload : action.payload.id;
      state.editing = state.items.find(u => u.id === id) || null;
    },
    closeEdit(state) {
      state.editing = null;
    },
    openAddToWorkspaces(state, action: PayloadAction<string>) {
      state.addToWorkspacesUserId = action.payload;
    },
    closeAddToWorkspaces(state) {
      state.addToWorkspacesUserId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        const normalize = (u: ListedUser): ListedUser => ({
          ...u,
          // normalize to uppercase enums to match filters
          roles: ((u.roles && u.roles.length > 0 ? u.roles : ((u as any).role ? [(u as any).role] : ['MEMBER'])) as any[]).map((r) => String(r).toUpperCase() as any),
          status: normalizeStatus((u as any).status as any),
        });
        state.items = (action.payload as ListedUser[]).map(normalize);
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Error';
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const incoming = action.payload as ListedUser;
        const updated: ListedUser = {
          ...incoming,
          roles: ((incoming.roles && incoming.roles.length > 0 ? incoming.roles : ((incoming as any).role ? [(incoming as any).role] : ['MEMBER'])) as any[]).map((r) => String(r).toUpperCase() as any),
          status: normalizeStatus((incoming as any).status as any),
        };
        const idx = state.items.findIndex(u => u.id === updated.id);
        if (idx >= 0) state.items[idx] = updated;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const incoming = action.payload as ListedUser;
        const updated: ListedUser = {
          ...incoming,
          roles: ((incoming.roles && incoming.roles.length > 0 ? incoming.roles : ((incoming as any).role ? [(incoming as any).role] : ['MEMBER'])) as any[]).map((r) => String(r).toUpperCase() as any),
          status: normalizeStatus((incoming as any).status as any),
        };
        const idx = state.items.findIndex(u => u.id === updated.id);
        if (idx >= 0) state.items[idx] = updated;
        if (state.editing?.id === updated.id) state.editing = updated;
      })
      .addCase(addUserToWorkspaces.fulfilled, (state, action) => {
        const incoming = action.payload as ListedUser;
        const updated: ListedUser = {
          ...incoming,
          roles: ((incoming.roles && incoming.roles.length > 0 ? incoming.roles : ((incoming as any).role ? [(incoming as any).role] : ['MEMBER'])) as any[]).map((r) => String(r).toUpperCase() as any),
          status: normalizeStatus((incoming as any).status as any),
        };
        const idx = state.items.findIndex(u => u.id === updated.id);
        if (idx >= 0) state.items[idx] = updated;
      });
  }
});

export const { reducer: usersReducer, actions: usersActions } = slice;

export const selectUsersState = (state: RootState) => state.users as UsersState;
export const selectUsers = (state: RootState) => selectUsersState(state)?.items;
export const selectUsersLoading = (state: RootState) => selectUsersState(state)?.loading;
export const selectUsersFilters = (state: RootState) => selectUsersState(state)?.filters;
export const selectUsersSort = (state: RootState) => selectUsersState(state)?.sort;
export const selectEditingUser = (state: RootState) => selectUsersState(state)?.editing;
export const selectAddToWorkspacesUserId = (state: RootState) => selectUsersState(state)?.addToWorkspacesUserId;
