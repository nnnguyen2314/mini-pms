"use client";
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import initStore, { persistedStore, createStore, RootState } from '../../shared/store';
import { ApolloProvider } from '@apollo/client';
import apolloClient from '../../shared/lib/apollo';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '../../shared/lib/queryClient';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../../shared/theme';

type ProvidersProps = { children: ReactNode; initialState?: Partial<RootState> };

export default function Providers({ children, initialState }: ProvidersProps) {
  // If an initial state is provided (tests), create a fresh store/persistor pair.
  const dynamic = initialState ? createStore(initialState) : null;
  const store = dynamic?.store ?? initStore;
  const persistor = dynamic?.persistor ?? (persistedStore as any);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
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
