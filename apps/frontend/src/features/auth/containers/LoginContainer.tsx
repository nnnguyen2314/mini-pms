"use client";
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import AuthForm from '../components/AuthForm';
import { loginThunk } from '../store/actions';
import { Container, Typography } from '@mui/material';

export default function LoginContainer() {
  const dispatch = useDispatch();
  const router = useRouter();
  async function onSubmit({ email = '', password = '' }: Record<string, string>) {
    await dispatch<any>(loginThunk({ email, password }));
    router.replace('/dashboard');
  }
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" align="center">Login</Typography>
      <AuthForm mode="login" onSubmit={onSubmit} />
    </Container>
  );
}
