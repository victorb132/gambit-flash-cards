import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme';
import Box from './Box';
import Text from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

const variantConfig: Record<
  ButtonVariant,
  { bg: keyof Theme['colors']; textColor: keyof Theme['colors'] }
> = {
  primary: { bg: 'primaryDark', textColor: 'white' },
  secondary: { bg: 'primaryLight', textColor: 'textPrimary' },
  danger: { bg: 'error', textColor: 'white' },
  warning: { bg: 'warning', textColor: 'white' },
  success: { bg: 'success', textColor: 'white' },
  ghost: { bg: 'transparent', textColor: 'primaryDark' },
};

/** Reusable themed button with loading and disabled states */
const Button = React.memo(function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme<Theme>();
  const config = variantConfig[variant];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={{ width: fullWidth ? '100%' : undefined, opacity: isDisabled ? 0.6 : 1 }}
    >
      <Box
        backgroundColor={config.bg}
        paddingVertical="m"
        paddingHorizontal="l"
        borderRadius="m"
        alignItems="center"
        justifyContent="center"
        flexDirection="row"
        style={
          variant === 'ghost'
            ? { borderWidth: 2, borderColor: theme.colors.primaryDark }
            : undefined
        }
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors[config.textColor]} size="small" />
        ) : (
          <Text variant="button" color={config.textColor}>
            {label}
          </Text>
        )}
      </Box>
    </TouchableOpacity>
  );
});

export default Button;
