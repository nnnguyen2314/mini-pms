"use client";
import { useDispatch } from 'react-redux';
import useAppSelector from '@/shared/hooks/useAppSelector';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Chip } from '@mui/material';
import { selectEditingUser, usersActions, updateUser } from '../store/slice';
import { useEffect, useState } from 'react';

export default function EditUserModal() {
  const dispatch = useDispatch();
  const editing = useAppSelector(selectEditingUser);
  const open = !!editing;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setEmail(editing.email);
      setRoles(editing.roles ?? []);
    }
  }, [editing]);

  const handleSave = async () => {
    if (!editing) return;
    await dispatch<any>(updateUser({ id: editing.id, name, email, roles: roles as any })).unwrap();
    dispatch(usersActions.closeEdit());
  };

  return (
    <Dialog open={open} onClose={() => dispatch(usersActions.closeEdit())} fullWidth maxWidth="sm">
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {['ADMIN','WORKSPACE_OWNER','PROJECT_OWNER','MEMBER','GUEST'].map(r => (
              <Chip key={r} label={r} color={roles.includes(r) ? 'primary' : 'default'} onClick={() => setRoles((prev) => prev.includes(r) ? prev.filter(x => x!== r) : [...prev, r])} />
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(usersActions.closeEdit())}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
