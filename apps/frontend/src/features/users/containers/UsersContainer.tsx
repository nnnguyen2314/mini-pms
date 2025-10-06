"use client";
import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import useAppSelector from '@/shared/hooks/useAppSelector';
import { selectCurrentUser } from '@/features/auth/store/selectors';
import { useDispatch } from 'react-redux';
import { fetchUsers, selectUsers, selectUsersFilters, selectUsersLoading, selectUsersSort, usersActions, type ListedUser } from '../store/slice';
import { Container, Typography, Box, Alert } from '@mui/material';
import UserTable from '../components/UserTable';
import EditUserModal from '../components/EditUserModal';
import AddToWorkspacesModal from '../components/AddToWorkspacesModal';

export default function UsersContainer() {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = (user?.roles ?? (user?.role ? [user.role] : [])).includes('ADMIN');
  const dispatch = useDispatch();
  const users = useAppSelector(selectUsers);
  const filters = useAppSelector(selectUsersFilters);
  const sort = useAppSelector(selectUsersSort);
  const loading = useAppSelector(selectUsersLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      dispatch<any>(fetchUsers()).unwrap().catch((e: any) => setError(e?.message ?? 'Failed to load'));
    }
  }, [dispatch, isAdmin]);

  const filteredSorted = useMemo(() => {
    let list: ListedUser[] = users.slice();
    // Apply filters
    if (filters.status && filters.status !== 'ALL') list = list.filter(u => u.status === filters.status);
    if (filters.role && filters.role !== 'ALL') list = list.filter(u => (u.roles ?? []).includes(filters.role as any));
    if (filters.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filters.workspace && filters.workspace !== 'ALL') list = list.filter(u => (u.workspaces ?? []).includes(filters.workspace!));
    if (filters.project && filters.project !== 'ALL') list = list.filter(u => (u.projects ?? []).includes(filters.project!));
    // Sort
    list.sort((a, b) => {
      const dir = sort.order === 'asc' ? 1 : -1;
      const key = sort.key;
      const av = key === 'workspaces' ? (a.workspaces?.join(',') ?? '') : key === 'projects' ? (a.projects?.join(',') ?? '') : (a as any)[key] ?? '';
      const bv = key === 'workspaces' ? (b.workspaces?.join(',') ?? '') : key === 'projects' ? (b.projects?.join(',') ?? '') : (b as any)[key] ?? '';
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [users, filters, sort]);

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Alert severity="error">You do not have permission to access User Management.</Alert>
        </Container>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Typography variant="h4" component="h1">User Management</Typography>
        {error && <Box sx={{ mt: 2 }}><Alert severity="error">{error}</Alert></Box>}
        <Box sx={{ mt: 2 }}>
          <UserTable users={filteredSorted} loading={loading} />
        </Box>
        <EditUserModal />
        <AddToWorkspacesModal />
      </Container>
    </ProtectedRoute>
  );
}
