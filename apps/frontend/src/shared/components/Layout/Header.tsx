"use client";
import NextLink from 'next/link';
import { useDispatch } from 'react-redux';
import useAppSelector from '../../../shared/hooks/useAppSelector';
import { selectCurrentUser, selectIsAuthenticated, selectIsAdmin } from '@/features/auth/store/selectors';
import { logoutThunk } from '@/features/auth/store/actions';
import { AppBar, Toolbar, Typography, Button, Avatar, Stack, Box } from '@mui/material';

const toHref = (label: string) => {
  switch (label) {
    case 'Users':
      return '/users';
    case 'Projects':
      return '/projects';
    case 'Tasks':
      return '/dashboard';
    case 'Workspaces':
      return '/workspaces';
    default:
      return '/dashboard';
  }
};

export function Header() {
  const dispatch = useDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const initial = (user?.name?.[0] ?? 'U').toUpperCase();

  // Only show top menu when user is authenticated and has ADMIN role
  const items = (isAuthenticated && isAdmin) ? ['Workspaces', 'Projects', 'Tasks', 'Users'] : [];

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography component={NextLink} href="/" variant="h6" fontWeight={700} color="inherit" sx={{ textDecoration: 'none' }}>
          Mini PM
        </Typography>

        {/* Main navigation - visible only for Admins */}
        {items.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {items.map((i) => (
              <Button key={i} LinkComponent={NextLink} href={toHref(i)} color="inherit" size="small">
                {i}
              </Button>
            ))}
          </Stack>
        )}
        {items.length === 0 && <Box sx={{ flexGrow: 1 }} />}

        <Box>
          {!isAuthenticated && (
            <Stack direction="row" spacing={1}>
              <Button LinkComponent={NextLink} href="/login" variant="outlined" color="primary">
                Login
              </Button>
              <Button LinkComponent={NextLink} href="/signup" variant="contained" color="primary">
                Sign Up
              </Button>
            </Stack>
          )}
          {isAuthenticated && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 32, height: 32 }} title={user?.name ?? undefined}>
                {initial}
              </Avatar>
              <Button variant="outlined" color="inherit" onClick={() => dispatch<any>(logoutThunk())}>
                Logout
              </Button>
            </Stack>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
