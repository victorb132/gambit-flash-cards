import React, { useState } from 'react';
import { TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { Theme } from '../../theme';
import Box from './Box';
import Text from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
}

/** Themed text input with optional label, error message and password toggle */
const Input = React.memo(function Input({
  label,
  error,
  isPassword = false,
  leftIcon,
  ...props
}: InputProps) {
  const theme = useTheme<Theme>();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Box marginBottom="m">
      {label && (
        <Text variant="label" marginBottom="xs">
          {label}
        </Text>
      )}
      <Box
        backgroundColor="surfaceLight"
        borderRadius="s"
        borderWidth={1}
        borderColor={error ? 'error' : 'border'}
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="m"
      >
        {leftIcon && <Box marginRight="s">{leftIcon}</Box>}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          style={{
            flex: 1,
            paddingVertical: 12,
            fontFamily: 'Poppins_400Regular',
            fontSize: 14,
            color: theme.colors.textPrimary,
          }}
          placeholderTextColor={theme.colors.textSecondary}
          accessibilityLabel={label}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeSlash size={20} color={theme.colors.textSecondary} />
            ) : (
              <Eye size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </Box>
      {error && (
        <Text variant="caption" color="error" marginTop="xs">
          {error}
        </Text>
      )}
    </Box>
  );
});

export default Input;
