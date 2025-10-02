"use client";
import { useRouter } from 'next/navigation';
import AuthForm from '../components/AuthForm';
import { authService } from '../../../shared/services/auth';
import { Container, Typography } from '@mui/material';

export default function ForgotPasswordContainer() {
  const router = useRouter();
  async function onSubmit({ email = '' }: Record<string, string>) {
    await authService.forgotPassword(email);
    router.replace('/login');
  }
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" align="center">Forgot Password</Typography>
      <AuthForm mode="forgot" onSubmit={onSubmit} />
    </Container>
  );
}
