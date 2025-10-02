import type { RootState } from '../../../shared/store';

export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user && !!state.auth.token;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectRoles = (state: RootState) => state.auth.roles ?? [];
export const selectPermissions = (state: RootState) => state.auth.permissions ?? [];
export const selectHasPermission = (perm: string) => (state: RootState) => (state.auth.permissions ?? []).includes(perm);
export const selectIsAdmin = (state: RootState) => (state.auth.roles ?? state.auth.user?.roles ?? []).includes('ADMIN');
export const selectIsWorkspaceOwner = (state: RootState) => (state.auth.roles ?? state.auth.user?.roles ?? []).includes('WORKSPACE_OWNER');
export const selectIsProjectOwner = (state: RootState) => (state.auth.roles ?? state.auth.user?.roles ?? []).includes('PROJECT_OWNER');
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
