import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeProvider as RestyleThemeProvider } from '@shopify/restyle';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '@/theme/index';

const THEME_KEY = '@gambit:theme';

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

  // Load persisted preference on mount; system scheme is only the fallback
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved !== null) setIsDark(saved === 'dark');
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
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
