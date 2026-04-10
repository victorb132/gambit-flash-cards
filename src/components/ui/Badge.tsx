import React from 'react';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { Theme } from '@/theme';

interface BadgeProps {
  label: string;
  color?: keyof Theme['colors'];
  textColor?: keyof Theme['colors'];
}

/** Small label badge with themed background */
const Badge = React.memo(function Badge({
  label,
  color = 'primaryLight',
  textColor = 'primaryDark',
}: BadgeProps) {
  return (
    <Box
      backgroundColor={color}
      borderRadius="round"
      paddingHorizontal="s"
      paddingVertical="xs"
    >
      <Text variant="caption" color={textColor} style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {label}
      </Text>
    </Box>
  );
});

export default Badge;
