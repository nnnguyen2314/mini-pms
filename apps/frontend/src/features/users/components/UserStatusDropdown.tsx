"use client";
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Menu, MenuItem, Chip, CircularProgress } from '@mui/material';
import type { ListedUser, UserStatus } from '../store/slice';
import { updateUserStatus } from '../store/slice';
import { codeToLabel } from '../misc/status';

export default function StatusDropdown({ user }: { user: ListedUser }) {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);

  const onSelect = async (status: UserStatus) => {
    setLoading(true);
    try {
      await dispatch<any>(updateUserStatus({ userId: user.id, status })).unwrap();
    } finally {
      setLoading(false);
      setAnchorEl(null);
    }
  };

  return (
    <>
      <Chip
        size="small"
        color={user.status === 'ACTIVE' ? 'success' : 'default'}
        label={loading ? <CircularProgress size={12} /> : codeToLabel(user.status)}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        variant="outlined"
      />
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => onSelect('ACTIVE')}>ACTIVE</MenuItem>
        <MenuItem onClick={() => onSelect('INACTIVE')}>INACTIVE</MenuItem>
      </Menu>
    </>
  );
}
