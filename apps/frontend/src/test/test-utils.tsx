import React, { PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import Providers from '@/shared/components/Providers';

// Simple utility to render components with the app Providers (Redux store, theme, etc.)
export function renderWithProviders(ui: React.ReactElement, options?: any) {
  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <Providers initialState={options?.preloadedState}>{children}</Providers>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
