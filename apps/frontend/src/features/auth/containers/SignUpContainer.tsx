"use client";
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import AuthForm from '../components/AuthForm';
import { signupThunk } from '../store/actions';
import { Container, Typography } from '@mui/material';

export default function SignUpContainer() {
  const dispatch = useDispatch();
  const router = useRouter();
  async function onSubmit({ name = '', email = '', password = '' }: Record<string, string>) {
    await dispatch<any>(signupThunk({ name, email, password }));
    router.replace('/dashboard');
  }
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" align="center">Sign Up</Typography>
      <AuthForm mode="signup" onSubmit={onSubmit} />
    </Container>
  );
}
