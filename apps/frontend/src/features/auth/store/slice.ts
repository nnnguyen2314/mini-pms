import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, User, Role } from '../../../shared/types/auth';
import { authService } from '../../../shared/services/auth';

export interface AuthSliceState extends AuthState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthSliceState = {
  user: null,
  token: null,
  roles: [],
  permissions: [],
  status: 'idle',
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }) => {
    const res = await authService.login(payload);
    return res;
  }
);

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async (payload: { name: string; email: string; password: string; role?: Role }) => {
    const res = await authService.signup(payload);
    return res;
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  return { user: null as User | null, token: null as string | null, roles: [] as Role[], permissions: [] as string[] };
});

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<AuthState>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.roles = action.payload.roles ?? action.payload.user?.roles ?? [];
      state.permissions = action.payload.permissions ?? [];
      state.error = null;
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.user = payload.user;
        state.token = payload.token;
        state.roles = payload.roles ?? payload.user?.roles ?? [];
        state.permissions = payload.permissions ?? [];
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(signupThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.user = payload.user;
        state.token = payload.token;
        state.roles = payload.roles ?? payload.user?.roles ?? [];
        state.permissions = payload.permissions ?? [];
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Signup failed';
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.roles = [];
        state.permissions = [];
        state.status = 'succeeded';
        state.error = null;
      });
  },
});

export const { reducer: authReducer, actions: authSliceActions } = slice;
