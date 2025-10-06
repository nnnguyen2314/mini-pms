"use client";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText } from '@mui/material';
import useAppSelector from '@/shared/hooks/useAppSelector';
import useAppDispatch from '@/shared/hooks/useAppDispatch';
import { addUsersToWorkspace, selectAddUsersWorkspaceId, workspacesActions } from '../../store/slice';
import { fetchUsers, selectUsers } from '@/features/users/store/slice';
import { selectCurrentUser } from '@/features/auth/store/selectors';
import { useEffect, useMemo, useState } from 'react';

export default function AddUsersToWorkspaceModal() {
  const dispatch = useAppDispatch();
  const workspaceId = useAppSelector(selectAddUsersWorkspaceId);
  const users = useAppSelector(selectUsers);
  const me = useAppSelector(selectCurrentUser);
  const open = !!workspaceId;
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && (!users || users.length === 0)) {
      dispatch<any>(fetchUsers());
    }
  }, [open]);

  const options = useMemo(() => users.filter(u => u.id !== me?.id), [users, me]);

  const onSave = async () => {
    if (!workspaceId) return;
    await dispatch<any>(addUsersToWorkspace({ id: workspaceId, userIds: selected }));
    dispatch(workspacesActions.closeAddUsers());
  };

  return (
    <Dialog open={open} onClose={() => dispatch(workspacesActions.closeAddUsers())} fullWidth maxWidth="sm">
      <DialogTitle>Add users to workspace</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="users-label">Users</InputLabel>
          <Select multiple labelId="users-label" value={selected} onChange={(e) => setSelected(e.target.value as string[])} input={<OutlinedInput label="Users" />} renderValue={(selected) => (selected as string[]).map(id => options.find(o => o.id === id)?.name || id).join(', ')}>
            {options.map(u => (
              <MenuItem key={u.id} value={u.id}>
                <Checkbox checked={selected.indexOf(u.id) > -1} />
                <ListItemText primary={`${u.name} (${u.email})`} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(workspacesActions.closeAddUsers())}>Cancel</Button>
        <Button onClick={onSave} variant="contained">Add</Button>
      </DialogActions>
    </Dialog>
  );
}
