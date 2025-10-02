"use client";
import { useDispatch } from 'react-redux';
import useAppSelector from '@/shared/hooks/useAppSelector';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Chip } from '@mui/material';
import { selectAddToWorkspacesUserId, usersActions, addUserToWorkspaces, selectUsers } from '../store/slice';
import { useEffect, useMemo, useState } from 'react';

// For demo: collect all workspaces from users' workspaces lists
export default function AddToWorkspacesModal() {
  const dispatch = useDispatch();
  const users = useAppSelector(selectUsers);
  const userId = useAppSelector(selectAddToWorkspacesUserId);
  const open = !!userId;
  const [selected, setSelected] = useState<string[]>([]);

  const allWorkspaces = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => (u.workspaces ?? []).forEach(w => set.add(w)));
    return Array.from(set);
  }, [users]);

  useEffect(() => {
    setSelected([]);
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    await dispatch<any>(addUserToWorkspaces({ userId, workspaceIds: selected })).unwrap();
    dispatch(usersActions.closeAddToWorkspaces());
  };

  return (
    <Dialog open={open} onClose={() => dispatch(usersActions.closeAddToWorkspaces())} fullWidth maxWidth="sm">
      <DialogTitle>Add to Workspaces</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
          {allWorkspaces.map(w => (
            <Chip key={w} label={w} color={selected.includes(w) ? 'primary' : 'default'} onClick={() => setSelected((prev) => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w])} />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(usersActions.closeAddToWorkspaces())}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={selected.length === 0}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
