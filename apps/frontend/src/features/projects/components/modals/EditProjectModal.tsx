"use client";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import useAppSelector from '@/shared/hooks/useAppSelector';
import useAppDispatch from '@/shared/hooks/useAppDispatch';
import { selectEditingProject, projectsActions, updateProject } from '../../store/slice';
import { useEffect, useState } from 'react';
import { fetchUsers, selectUsers } from '@/features/users/store/slice';
import { fetchWorkspaces, selectWorkspaces } from '@/features/workspaces/store/slice';

export default function EditProjectModal() {
  const dispatch = useAppDispatch();
  const editing = useAppSelector(selectEditingProject);
  const open = !!editing;
  const users = useAppSelector<any>(selectUsers as any);
  const workspaces = useAppSelector<any>(selectWorkspaces as any);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState<string>('');
  const [workspaceId, setWorkspaceId] = useState<string>('');

  useEffect(() => {
    if (open) {
      if (!users || users.length === 0) dispatch<any>(fetchUsers());
      if (!workspaces || workspaces.length === 0) dispatch<any>(fetchWorkspaces());
    }
  }, [open]);

  useEffect(() => {
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setOwnerId(editing?.createdBy ?? '');
    setWorkspaceId((editing as any)?.workspaceId ?? '');
  }, [editing]);

  const onSave = async () => {
    if (!editing) return;
    await dispatch<any>(updateProject({ id: editing.id, patch: { name, description, createdBy: ownerId, workspaceId } }));
    dispatch(projectsActions.closeEdit());
  };

  return (
    <Dialog open={open} onClose={() => dispatch(projectsActions.closeEdit())} fullWidth maxWidth="sm">
      <DialogTitle>Edit Project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} />
          <FormControl fullWidth>
            <InputLabel id="workspace-label">Workspace</InputLabel>
            <Select labelId="workspace-label" label="Workspace" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value as string)}>
              {workspaces?.map((w: any) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="owner-label">Owner</InputLabel>
            <Select labelId="owner-label" label="Owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value as string)}>
              {users?.map((u: any) => (
                <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(projectsActions.closeEdit())}>Cancel</Button>
        <Button onClick={onSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
