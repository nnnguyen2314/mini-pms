import type { RootState } from '../../../shared/store';

export const selectDashboard = (state: RootState) => state.dashboard;
export const selectSelectedMenu = (state: RootState) => state.dashboard.selectedMenu;
