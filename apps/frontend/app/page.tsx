"use client";

import NextLink from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAppSelector from "../src/shared/hooks/useAppSelector";
import { selectIsAuthenticated } from "@/features/auth/store/selectors";
import {Container, Stack, Typography, Button, Box} from "@mui/material";

export default function Home() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 8, px: 2 }}>
          <Stack spacing={3}>
              <Typography variant="h3" component="h1">Welcome to Mini PM</Typography>
              <Typography variant="h6" color="text.secondary">
                  A lightweight project management platform with workspaces, projects, boards, tasks, and collaboration tools.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                  Sign in to start organizing your work, track progress across boards, and collaborate with your team.
              </Typography>
              <Box>
                  <Button LinkComponent={NextLink} href="/login" variant="contained" color="primary" size="large">Getting started</Button>
              </Box>
          </Stack>
      </Box>
  );
}
