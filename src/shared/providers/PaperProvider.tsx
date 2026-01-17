import { PaperProvider as RNPaperProvider } from 'react-native-paper';

import { ThemeProvider, useAppTheme } from '../theme/ThemeContext';

import type { ReactNode } from 'react';

interface PaperProviderProps {
  children: ReactNode;
}

function PaperProviderInner({ children }: PaperProviderProps): React.ReactElement {
  const { theme } = useAppTheme();
  return <RNPaperProvider theme={theme}>{children}</RNPaperProvider>;
}

export function PaperProvider({ children }: PaperProviderProps): React.ReactElement {
  return (
    <ThemeProvider>
      <PaperProviderInner>{children}</PaperProviderInner>
    </ThemeProvider>
  );
}
