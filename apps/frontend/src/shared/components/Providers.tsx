"use client";
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import initStore, { persistedStore } from '../../shared/store';
import { ApolloProvider } from '@apollo/client';
import apolloClient from '../../shared/lib/apollo';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '../../shared/lib/queryClient';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../../shared/theme';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={initStore}>
      <PersistGate loading={null} persistor={persistedStore as any}>
        <ApolloProvider client={apolloClient}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {children}
            </ThemeProvider>
          </QueryClientProvider>
        </ApolloProvider>
      </PersistGate>
    </Provider>
  );
}
