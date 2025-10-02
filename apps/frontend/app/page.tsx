"use client";

import NextLink from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAppSelector from "../src/shared/hooks/useAppSelector";
import { selectIsAuthenticated } from "../src/features/auth/store/selectors";
import { Container, Stack, Typography, Button } from "@mui/material";

export default function Home() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography variant="h3" component="h1">Welcome to Mini PM</Typography>
        <Typography variant="body1">A minimal project management app. Manage workspaces, projects and tasks.</Typography>
        <Button LinkComponent={NextLink} href="/login" variant="contained" size="large">Getting started</Button>
      </Stack>
    </Container>
  );
}
