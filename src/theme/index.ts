import { createTheme } from '@shopify/restyle';
import { lightColors, darkColors } from './colors';
import { spacing, borderRadius } from './spacing';
import { textVariants } from './typography';

export const lightTheme = createTheme({
  colors: lightColors,
  spacing,
  borderRadii: borderRadius,
  textVariants,
  breakpoints: {},
});

export type Theme = typeof lightTheme;

// Restyle requires dark theme to match light theme's color token keys.
// We cast to Theme to satisfy type checking while using dark hex values.
export const darkTheme = {
  ...lightTheme,
  colors: darkColors as unknown as Theme['colors'],
} satisfies Theme;
