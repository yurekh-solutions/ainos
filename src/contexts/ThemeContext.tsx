'use client';

import { createContext, useContext, ReactNode } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always light theme - dark theme removed
  const theme: Theme = 'light';
  
  const setTheme = (_newTheme: Theme) => {
    // No-op: dark theme removed, always light
  };

  const toggleTheme = () => {
    // No-op: dark theme removed, always light
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
