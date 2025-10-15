"use client";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, ToggleButtonGroup, ToggleButton } from '@mui/material';
import useAppSelector from '@/shared/hooks/useAppSelector';
import useAppDispatch from '@/shared/hooks/useAppDispatch';
import { selectStatusEditingId, workspacesActions, updateWorkspace } from '../../store/slice';
import React, { useState } from 'react';

export default function StatusModal() {
  const dispatch = useAppDispatch();
  const id = useAppSelector(selectStatusEditingId);
  const open = !!id;
  const [value, setValue] = useState<'0'|'1'|'2'>('1');

  const onSave = async () => {
    if (!id) return;
    const status = Number(value) as 0|1|2;
    await dispatch(updateWorkspace({ id, patch: { status } }));
    dispatch(workspacesActions.closeStatusEdit());
  };

  return (
    <Dialog open={open} onClose={() => dispatch(workspacesActions.closeStatusEdit())} fullWidth maxWidth="xs">
      <DialogTitle>Update Status</DialogTitle>
      <DialogContent>
        <Stack sx={{ mt: 1 }}>
          <ToggleButtonGroup exclusive value={value} onChange={(_e, v) => v && setValue(v)} size="small">
            <ToggleButton value="0">Inactive</ToggleButton>
            <ToggleButton value="1">Active</ToggleButton>
            <ToggleButton value="2">Archived</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(workspacesActions.closeStatusEdit())}>Cancel</Button>
        <Button onClick={onSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
