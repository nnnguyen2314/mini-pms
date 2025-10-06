"use client";
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import { Container, Typography, Box, Stack, TextField, Button, CircularProgress } from '@mui/material';
import { useEffect, useMemo } from 'react';
import useAppDispatch from '@/shared/hooks/useAppDispatch';
import useAppSelector from '@/shared/hooks/useAppSelector';
import { selectCurrentUser } from '@/features/auth/store/selectors';
import { fetchProjects, selectProjects, selectProjectsFilters, selectProjectsLoading, selectProjectsSort, projectsActions } from '../store/slice';
import ProjectsTable from '../components/ProjectsTable';
import ProjectStatusModal from '../components/modals/ProjectStatusModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import AddProjectModal from '../components/modals/AddProjectModal';

export default function ProjectsContainer() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const items = useAppSelector(selectProjects);
  const loading = useAppSelector(selectProjectsLoading);
  const filters = useAppSelector(selectProjectsFilters);
  const sort = useAppSelector(selectProjectsSort);

  useEffect(() => { dispatch(fetchProjects() as any); }, [dispatch]);

  const list = useMemo(() => {
    let list = [...items];
    // Filters
    if (filters.name) list = list.filter(p => p.name.toLowerCase().includes(filters.name.toLowerCase()));
    if (filters.owner) list = list.filter(p => (p.createdBy || '').toLowerCase().includes(filters.owner.toLowerCase()));
    if (filters.workspace) list = list.filter(p => (p.workspaceName || '').toLowerCase().includes(filters.workspace.toLowerCase()));
    // Sort
    list.sort((a,b) => {
      const key = sort.key;
      const av = key === 'owner' ? (a.createdBy || '') : key === 'workspace' ? (a.workspaceName || '') : (a as any)[key] || '';
      const bv = key === 'owner' ? (b.createdBy || '') : key === 'workspace' ? (b.workspaceName || '') : (b as any)[key] || '';
      const cmp = String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, filters, sort]);

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4">Projects</Typography>
            <Typography variant="body2" color="text.secondary">Manage all projects</Typography>
          </Box>
          <Button variant="contained" size="small" onClick={() => dispatch(projectsActions.openAddNew())}>Add new project</Button>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Filter by name" size="small" value={filters.name} onChange={(e) => dispatch(projectsActions.setFilter({ name: e.target.value }))} />
          <TextField label="Filter by owner" size="small" value={filters.owner} onChange={(e) => dispatch(projectsActions.setFilter({ owner: e.target.value }))} />
          <TextField label="Filter by workspace" size="small" value={filters.workspace} onChange={(e) => dispatch(projectsActions.setFilter({ workspace: e.target.value }))} />
        </Stack>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ProjectsTable items={list} />
        )}
        <EditProjectModal />
        <ProjectStatusModal />
        <AddProjectModal />
      </Container>
    </ProtectedRoute>
  );
}
