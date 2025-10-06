import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/store/slice';
import { dashboardReducer } from '@/features/dashboard/store/slice';
import { usersReducer } from '@/features/users/store/slice';
import workspacesReducer from '@/features/workspaces/store/slice';
import projectsReducer from '@/features/projects/store/slice';

// App Router does not require HYDRATE handling from next-redux-wrapper.
// Use a plain combined reducer.
const reducers = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  users: usersReducer,
  workspaces: workspacesReducer,
  projects: projectsReducer,
}) as any;

export type RootState = ReturnType<typeof reducers>;
export default reducers;
