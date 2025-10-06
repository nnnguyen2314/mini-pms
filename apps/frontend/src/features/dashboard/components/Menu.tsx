"use client";
import type { Role } from '@/shared/types/auth';
import { Stack, Chip, Box } from '@mui/material';
import NextLink from 'next/link';

export function DashboardMenu({ role }: { role: Role }) {
  const baseItems = ['Workspaces','Projects','Tasks'];
  const items = role === 'ADMIN' ? [...baseItems, 'Users'] : baseItems;
  const toHref = (label: string) => {
    switch (label) {
      case 'Users': return '/users';
      case 'Projects': return '/projects';
      case 'Tasks': return '/dashboard';
      case 'Workspaces': return '/workspaces';
      default: return '/dashboard';
    }
  };
  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1, py: 1 }}>
      <Stack direction="row" spacing={1}>
        {items.map((i) => (
          <Chip key={i} component={NextLink} href={toHref(i)} clickable label={i} variant="outlined" size="small" />
        ))}
      </Stack>
    </Box>
  );
}
