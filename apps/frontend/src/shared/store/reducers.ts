import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/store/slice';
import { dashboardReducer } from '@/features/dashboard/store/slice';
import { usersReducer } from '@/features/users/store/slice';

// App Router does not require HYDRATE handling from next-redux-wrapper.
// Use a plain combined reducer.
const reducers = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  users: usersReducer,
});

export default reducers;
