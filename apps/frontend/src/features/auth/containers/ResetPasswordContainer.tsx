"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '../components/AuthForm';
import { authService } from '../../../shared/services/auth';
import { Container, Typography } from '@mui/material';

export default function ResetPasswordContainer() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  async function onSubmit({ password = '' }: Record<string, string>) {
    await authService.resetPassword(token, password);
    router.replace('/login');
  }
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" align="center">Reset Password</Typography>
      <AuthForm mode="reset" onSubmit={onSubmit} />
    </Container>
  );
}
