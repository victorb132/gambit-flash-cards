export const lightColors = {
  primaryDark: '#346739',
  primary: '#79AE6F',
  primaryLight: '#9FCB98',
  surface: '#F2EDC2',
  surfaceLight: '#F8F5E0',
  textPrimary: '#1A2E1B',
  textSecondary: '#4A5D4B',
  white: '#FFFFFF',
  error: '#C0392B',
  warning: '#E67E22',
  success: '#27AE60',
  // Additional semantic colors
  border: '#D0D9C0',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  transparent: 'transparent',
} as const;

export const darkColors = {
  primaryDark: '#9FCB98',
  primary: '#79AE6F',
  primaryLight: '#346739',
  surface: '#1A1E1A',
  surfaceLight: '#252B25',
  textPrimary: '#F2EDC2',
  textSecondary: '#A8B5A9',
  white: '#2A302A',
  error: '#E74C3C',
  warning: '#F39C12',
  success: '#2ECC71',
  border: '#3A4A3A',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  transparent: 'transparent',
} as const;

export type AppColors = typeof lightColors;
