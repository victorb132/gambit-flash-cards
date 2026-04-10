import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
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

/** Reusable themed button — compact futuristic style */
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={{ width: fullWidth ? '100%' : undefined, opacity: isDisabled ? 0.45 : 1 }}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Box
          backgroundColor={config.bg}
          paddingVertical="s"
          paddingHorizontal="l"
          borderRadius="s"
          alignItems="center"
          justifyContent="center"
          flexDirection="row"
          style={
            variant === 'ghost'
              ? { borderWidth: 1, borderColor: theme.colors.primaryDark }
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
      </Animated.View>
    </TouchableOpacity>
  );
});

export default Button;
