"use client";
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import { Container, Typography, Box, Stack, TextField, CircularProgress } from '@mui/material';
import { useEffect, useMemo } from 'react';
import useAppDispatch from '@/shared/hooks/useAppDispatch';
import useAppSelector from '@/shared/hooks/useAppSelector';
import { selectCurrentUser } from '@/features/auth/store/selectors';
import { fetchWorkspaces, selectWorkspaces, selectWorkspacesFilters, selectWorkspacesLoading, selectWorkspacesSort, workspacesActions } from '../store/slice';
import WorkspacesTable from '../components/WorkspacesTable';
import EditWorkspaceModal from '../components/modals/EditWorkspaceModal';
import StatusModal from '../components/modals/StatusModal';
import AddUsersToWorkspaceModal from '../components/modals/AddUsersToWorkspaceModal';

export default function WorkspacesContainer() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const items = useAppSelector(selectWorkspaces);
  const loading = useAppSelector(selectWorkspacesLoading);
  const filters = useAppSelector(selectWorkspacesFilters);
  const sort = useAppSelector(selectWorkspacesSort);

  useEffect(() => { dispatch(fetchWorkspaces() as any); }, [dispatch]);

  const list = useMemo(() => {
    let list = [...items];
    // Filters
    if (filters.name) list = list.filter(w => w.name.toLowerCase().includes(filters.name.toLowerCase()));
    if (filters.owner) list = list.filter(w => (w.createdBy || '').toLowerCase().includes(filters.owner.toLowerCase()));
    // Sort
    list.sort((a,b) => {
      const key = sort.key;
      const av = key === 'owner' ? (a.createdBy || '') : (a as any)[key] || '';
      const bv = key === 'owner' ? (b.createdBy || '') : (b as any)[key] || '';
      const cmp = String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, filters, sort]);

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4">Workspaces</Typography>
          <Typography variant="body2" color="text.secondary">Manage all workspaces</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Filter by name" size="small" value={filters.name} onChange={(e) => dispatch(workspacesActions.setFilter({ name: e.target.value }))} />
          <TextField label="Filter by owner" size="small" value={filters.owner} onChange={(e) => dispatch(workspacesActions.setFilter({ owner: e.target.value }))} />
        </Stack>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <WorkspacesTable items={list} />
        )}
        <EditWorkspaceModal />
        <StatusModal />
        <AddUsersToWorkspaceModal />
      </Container>
    </ProtectedRoute>
  );
}
