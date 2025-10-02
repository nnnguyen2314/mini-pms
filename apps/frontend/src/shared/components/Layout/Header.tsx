"use client";
import NextLink from 'next/link';
import { useDispatch } from 'react-redux';
import useAppSelector from '../../../shared/hooks/useAppSelector';
import { selectCurrentUser, selectIsAuthenticated } from '@/features/auth/store/selectors';
import { logoutThunk } from '@/features/auth/store/actions';
import { AppBar, Toolbar, Typography, Button, Avatar, Stack, Box } from '@mui/material';

export function Header() {
  const dispatch = useDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const initial = (user?.name?.[0] ?? 'U').toUpperCase();
  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography component={NextLink} href="/" variant="h6" fontWeight={700} color="inherit" sx={{ textDecoration: 'none' }}>
          Mini PM
        </Typography>
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
