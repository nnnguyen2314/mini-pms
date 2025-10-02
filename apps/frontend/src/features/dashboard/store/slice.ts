import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DashboardState {
  // simple example state: selected menu
  selectedMenu: 'Workspaces' | 'Projects' | 'Tasks' | 'Users' | null;
}

const initialState: DashboardState = {
  selectedMenu: null,
};

const slice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedMenu(state, action: PayloadAction<DashboardState['selectedMenu']>) {
      state.selectedMenu = action.payload;
    },
  },
});

export const { reducer: dashboardReducer, actions: dashboardActions } = slice;
