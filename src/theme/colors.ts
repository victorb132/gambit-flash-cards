export const lightColors = {
  primaryDark: '#5E0006',
  primary: '#9B0F06',
  primaryLight: '#D53E0F',
  surface: '#EED9B9',
  surfaceLight: '#F7F0E2',
  textPrimary: '#2D0A08',
  textSecondary: '#6B3530',
  white: '#FFFFFF',
  error: '#C0392B',
  warning: '#E67E22',
  success: '#27AE60',
  // Additional semantic colors
  border: '#D4BFA0',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  transparent: 'transparent',
} as const;

export const darkColors = {
  primaryDark: '#EED9B9',
  primary: '#D53E0F',
  primaryLight: '#9B0F06',
  surface: '#1A0805',
  surfaceLight: '#281210',
  textPrimary: '#EED9B9',
  textSecondary: '#C4A882',
  white: '#281210',
  error: '#E74C3C',
  warning: '#F39C12',
  success: '#2ECC71',
  border: '#4A1A15',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  transparent: 'transparent',
} as const;

export type AppColors = typeof lightColors;
