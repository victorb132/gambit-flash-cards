import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeProvider as RestyleThemeProvider } from '@shopify/restyle';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './index';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    setIsDark(systemScheme === 'dark');
  }, [systemScheme]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <RestyleThemeProvider theme={theme}>{children}</RestyleThemeProvider>
    </ThemeContext.Provider>
  );
}

/** Hook to access theme toggle and current dark mode state */
export function useAppTheme() {
  return useContext(ThemeContext);
}
