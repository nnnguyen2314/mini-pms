import { authService } from '../src/shared/services/auth';
import { AUTH_KEY, storage } from '../src/shared/utils/storage';

describe('authService', () => {
  afterEach(() => {
    storage.remove(AUTH_KEY);
  });

  test('login sets auth with token and user', async () => {
    const res = await authService.login({ email: 'admin@example.com', password: 'x' });
    expect(res.user).toBeTruthy();
    expect(res.token).toBeTruthy();
    expect(authService.isAuthenticated()).toBe(true);
  });

  test('signup stores user and token', async () => {
    const res = await authService.signup({ name: 'John', email: 'john@example.com', password: 'x' });
    expect(res.user?.name).toBe('John');
    expect(authService.getAuth()).toEqual(res);
  });

  test('logout clears auth', () => {
    authService.clearAuth();
    expect(authService.isAuthenticated()).toBe(false);
  });
});
