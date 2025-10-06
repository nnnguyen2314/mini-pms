"use client";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from '@mui/material';
import useAppSelector from '@/shared/hooks/useAppSelector';
import useAppDispatch from '@/shared/hooks/useAppDispatch';
import { selectEditingWorkspace, workspacesActions, updateWorkspace } from '../../store/slice';
import { useEffect, useState } from 'react';

export default function EditWorkspaceModal() {
  const dispatch = useAppDispatch();
  const editing = useAppSelector(selectEditingWorkspace);
  const open = !!editing;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
  }, [editing]);

  const onSave = async () => {
    if (!editing) return;
    await dispatch<any>(updateWorkspace({ id: editing.id, patch: { name, description } }));
    dispatch(workspacesActions.closeEdit());
  };

  return (
    <Dialog open={open} onClose={() => dispatch(workspacesActions.closeEdit())} fullWidth maxWidth="sm">
      <DialogTitle>Edit Workspace</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(workspacesActions.closeEdit())}>Cancel</Button>
        <Button onClick={onSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
