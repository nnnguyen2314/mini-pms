"use client";
import ProtectedRoute from '../../../shared/components/ProtectedRoute';
import { DashboardMenu } from '../components/Menu';
import useAppSelector from '../../../shared/hooks/useAppSelector';
import { selectCurrentUser, selectIsAdmin } from '../../auth/store/selectors';
import { Container, Typography, Box } from '@mui/material';

export default function DashboardContainer() {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const effectiveRole = isAdmin ? 'ADMIN' : (user?.role ?? 'MEMBER');
  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {user && <DashboardMenu role={effectiveRole as any} />}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" component="h1">Dashboard</Typography>
          <Typography variant="body1">Welcome back, {user?.name}!</Typography>
        </Box>
      </Container>
    </ProtectedRoute>
  );
}
