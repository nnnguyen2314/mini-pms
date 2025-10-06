"use client";
import { Workspace } from '@/shared/services/workspaces';
import workspacesService from '@/shared/services/workspaces';
import { Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { useDispatch } from 'react-redux';
import { workspacesActions, selectWorkspacesSort } from '../store/slice';
import useAppSelector from '@/shared/hooks/useAppSelector';

export default function WorkspacesTable({ items }: { items: Workspace[] }) {
  const dispatch = useDispatch();
  const sort = useAppSelector(selectWorkspacesSort);

  const headers: { key: 'name'|'owner'|'createdAt'|'updatedAt'|'status'|'actions'; label: string; sortable?: boolean }[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true },
    { key: 'updatedAt', label: 'Updated', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  const onSort = (key: any) => dispatch(workspacesActions.setSort({ key }));

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {headers.map(h => (
            <TableCell key={h.key}>
              {h.sortable ? (
                <TableSortLabel active={sort.key === h.key} direction={sort.dir} onClick={() => onSort(h.key)}>
                  {h.label}
                </TableSortLabel>
              ) : h.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(w => (
          <TableRow key={w.id} hover>
            <TableCell>{w.name}</TableCell>
            <TableCell>{w.createdBy}</TableCell>
            <TableCell>{new Date(w.createdAt).toLocaleString()}</TableCell>
            <TableCell>{new Date(w.updatedAt).toLocaleString()}</TableCell>
            <TableCell>
              <Chip size="small" label={workspacesService.statusToName(w.status)} onClick={() => dispatch(workspacesActions.openStatusEdit(w.id))} />
            </TableCell>
            <TableCell>
              <IconButton size="small" title="Edit" onClick={() => dispatch(workspacesActions.openEdit(w))}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" title="Add users" onClick={() => dispatch(workspacesActions.openAddUsers(w.id))}><GroupAddIcon fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
