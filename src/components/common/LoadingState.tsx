import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '../ui/Box';
import Text from '../ui/Text';
import { Theme } from '../../theme';

interface LoadingStateProps {
  message?: string;
}

/** Full-screen centered loading indicator */
const LoadingState = React.memo(function LoadingState({ message }: LoadingStateProps) {
  const theme = useTheme<Theme>();
  return (
    <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="surface" padding="xl">
      <ActivityIndicator size="large" color={theme.colors.primaryDark} />
      {message && (
        <Text variant="bodySmall" marginTop="m" textAlign="center" color="textSecondary">
          {message}
        </Text>
      )}
    </Box>
  );
});

export default LoadingState;
