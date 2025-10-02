"use client";
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, IconButton, MenuItem, Select, TextField, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import type { ListedUser, SortKey, SortOrder } from '../store/slice';
import { usersActions, selectUsersFilters, selectUsersSort } from '../store/slice';
import useAppSelector from '@/shared/hooks/useAppSelector';
import StatusDropdown from './UserStatusDropdown';

export default function UserTable({ users, loading }: { users: ListedUser[]; loading: boolean }) {
  const dispatch = useDispatch();
  const filters = useAppSelector(selectUsersFilters);
  const sort = useAppSelector(selectUsersSort);

  const headers: { key: SortKey; label: string }[] = useMemo(() => ([
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'workspaces', label: 'Workspaces' },
    { key: 'projects', label: 'Projects' },
    { key: 'status', label: 'Status' },
  ]), []);

  const toggleSort = (key: SortKey) => {
    const order: SortOrder = sort.key === key && sort.order === 'asc' ? 'desc' : 'asc';
    dispatch(usersActions.setSort({ key, order }));
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Select size="small" value={filters.status ?? 'ALL'} onChange={(e) => dispatch(usersActions.setFilters({ status: e.target.value as any }))}>
          <MenuItem value="ALL">All Status</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </Select>
        <Select size="small" value={filters.role ?? 'ALL'} onChange={(e) => dispatch(usersActions.setFilters({ role: e.target.value as any }))}>
          <MenuItem value="ALL">All Roles</MenuItem>
          <MenuItem value="ADMIN">Admin</MenuItem>
          <MenuItem value="WORKSPACE_OWNER">Workspace Owner</MenuItem>
          <MenuItem value="PROJECT_OWNER">Project Owner</MenuItem>
          <MenuItem value="MEMBER">Member</MenuItem>
          <MenuItem value="GUEST">Guest</MenuItem>
        </Select>
        <TextField size="small" placeholder="Search name or email" value={filters.query ?? ''} onChange={(e) => dispatch(usersActions.setFilters({ query: e.target.value }))} />
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map(h => (
                <TableCell key={h.key} onClick={() => toggleSort(h.key)} sx={{ cursor: 'pointer' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>{h.label}</Typography>
                    {sort.key === h.key && <Typography variant="caption">{sort.order === 'asc' ? '▲' : '▼'}</Typography>}
                  </Stack>
                </TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={headers.length + 1} align="center">
                  <CircularProgress size={20} />
                </TableCell>
              </TableRow>
            )}
            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={headers.length + 1} align="center">No users</TableCell>
              </TableRow>
            )}
            {!loading && users.map(u => (
              <TableRow key={u.id} hover>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{(u.workspaces ?? []).join(', ')}</TableCell>
                <TableCell>{(u.projects ?? []).join(', ')}</TableCell>
                <TableCell>
                  <StatusDropdown user={u} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" title="Edit" onClick={() => dispatch(usersActions.openEdit(u.id))}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" title="Add to workspaces" onClick={() => dispatch(usersActions.openAddToWorkspaces(u.id))}>
                    <GroupAddIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
