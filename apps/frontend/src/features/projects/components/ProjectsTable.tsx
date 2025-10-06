"use client";
import { Project } from '@/shared/services/projects';
import projectsService from '@/shared/services/projects';
import { Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch } from 'react-redux';
import { projectsActions, selectProjectsSort } from '../store/slice';
import useAppSelector from '@/shared/hooks/useAppSelector';

export default function ProjectsTable({ items }: { items: Project[] }) {
  const dispatch = useDispatch();
  const sort = useAppSelector(selectProjectsSort);

  const headers: { key: 'name'|'owner'|'workspace'|'createdAt'|'updatedAt'|'status'|'actions'; label: string; sortable?: boolean }[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'workspace', label: 'Workspace', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true },
    { key: 'updatedAt', label: 'Updated', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  const onSort = (key: any) => dispatch(projectsActions.setSort({ key }));

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
        {items.map(p => (
          <TableRow key={p.id} hover>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.createdBy}</TableCell>
            <TableCell>{p.workspaceName ?? ''}</TableCell>
            <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
            <TableCell>{new Date(p.updatedAt).toLocaleString()}</TableCell>
            <TableCell>
              <Chip size="small" label={projectsService.statusToName(p.status)} onClick={() => dispatch(projectsActions.openStatusEdit(p.id))} />
            </TableCell>
            <TableCell>
              <IconButton size="small" title="Edit" onClick={() => dispatch(projectsActions.openEdit(p))}><EditIcon fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
