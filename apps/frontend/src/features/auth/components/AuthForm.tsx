"use client";
import NextLink from 'next/link';
import { useState, type FormEvent } from 'react';
import { Box, Stack, TextField, Button, Alert } from '@mui/material';

export interface AuthFormProps {
  mode: 'login' | 'signup' | 'forgot' | 'reset';
  onSubmit: (data: Record<string, string>) => Promise<void> | void;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    await onSubmit({ email, password, name });
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 380, mx: 'auto', my: 3 }}>
      <Stack spacing={2}>
        {mode === 'signup' && (
          <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} required fullWidth variant="outlined" />
        )}
        {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
          <TextField label="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required fullWidth variant="outlined" />
        )}
        {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
          <TextField label="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required fullWidth />
        )}
        <Button type="submit" variant="contained">Submit</Button>
        {mode === 'login' && (
          <Stack direction="row" justifyContent="space-between">
            <Button LinkComponent={NextLink} href="/signup" variant="text">Sign Up</Button>
            <Button LinkComponent={NextLink} href="/forgot-password" variant="text">Forgot Password</Button>
          </Stack>
        )}
        {status && <Alert severity="info">{status}</Alert>}
      </Stack>
    </Box>
  );
}
