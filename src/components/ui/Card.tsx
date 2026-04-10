import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, Platform } from 'react-native';
import Box from '@/components/ui/Box';
import { Theme } from '@/theme';
import { useTheme } from '@shopify/restyle';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  noPadding?: boolean;
}

/** Themed card container with subtle shadow and rounded corners */
const Card = React.memo(function Card({ children, onPress, noPadding, style, ...props }: CardProps) {
  const theme = useTheme<Theme>();

  const shadow =
    Platform.OS === 'ios'
      ? {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }
      : { elevation: 3 };

  const content = (
    <Box
      backgroundColor="white"
      borderRadius="l"
      padding={noPadding ? undefined : 'm'}
      style={[shadow, style as object]}
    >
      {children}
    </Box>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} {...props}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
});

export default Card;
