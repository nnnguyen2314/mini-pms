"use client";
import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import initStore, { persistedStore } from '../../store';
import { CssBaseline, ThemeProvider, Container, Box } from '@mui/material';
import theme from '../../theme';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '../../lib/queryClient';
import SnackbarNotification from '../SnackbarNotification';
import { Header } from '@/shared/components/Layout/Header';

export default function RootContent({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={initStore}>
            <PersistGate loading={null} persistor={persistedStore as any}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <QueryClientProvider client={queryClient}>
                        <SnackbarNotification />
                        <Header />
                        <Container maxWidth="lg" disableGutters sx={{ px: '0' }}>
                            <Suspense fallback={<div>Loading...</div>}>
                                <Box sx={{ marginTop: 4 }}>
                                    <main>{children}</main>
                                </Box>
                            </Suspense>
                        </Container>
                    </QueryClientProvider>
                </ThemeProvider>
            </PersistGate>
        </Provider>
    );
}