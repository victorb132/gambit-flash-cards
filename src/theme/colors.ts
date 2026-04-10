export const lightColors = {
  primaryDark: '#000000',
  primary: '#1A1A1A',
  primaryLight: '#444444',
  surface: '#F5F5F5',
  surfaceLight: '#FFFFFF',
  textPrimary: '#080808',
  textSecondary: '#666666',
  white: '#FFFFFF',
  error: '#E53935',
  warning: '#F57C00',
  success: '#2E7D32',
  border: '#E0E0E0',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  transparent: 'transparent',
} as const;

export const darkColors = {
  primaryDark: '#FFFFFF',
  primary: '#CCCCCC',
  primaryLight: '#808080',
  surface: '#050505',
  surfaceLight: '#0F0F0F',
  textPrimary: '#EEEEEE',
  textSecondary: '#505050',
  white: '#0F0F0F',
  error: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',
  border: '#1C1C1C',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.88)',
  transparent: 'transparent',
} as const;

export type AppColors = typeof lightColors;
