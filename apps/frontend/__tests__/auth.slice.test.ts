import { authReducer, authSliceActions } from '../src/features/auth/store/slice';
import type { AuthState } from '../src/shared/types/auth';

describe('auth slice', () => {
  test('setAuth sets user and token', () => {
    const initial: any = { user: null, token: null, status: 'idle', error: null };
    const payload: AuthState = {
      user: { id: '1', email: 'a@a.com', name: 'A', role: 'MEMBER' },
      token: 't',
    };
    const state = authReducer(initial, authSliceActions.setAuth(payload));
    expect(state.user?.email).toBe('a@a.com');
    expect(state.token).toBe('t');
  });

  test('logout resets auth', () => {
    const initial: any = {
      user: { id: '1', email: 'a@a.com', name: 'A', role: 'Admin' },
      token: 't',
      status: 'succeeded',
      error: null,
    };
    // simulate fulfilled logout thunk
    const state = authReducer(initial, { type: 'auth/logout/fulfilled', payload: { user: null, token: null } });
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
