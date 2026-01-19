import { createContext, useContext, useMemo } from 'react';

import { colors } from './colors';

import type { ReactNode } from 'react';

interface ThemeContextValue {
  colors: typeof colors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const value = useMemo(
    () => ({
      colors,
      isDark: true,
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}
