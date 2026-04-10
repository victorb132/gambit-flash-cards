import React from 'react';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly empty state with optional CTA button */
const EmptyState = React.memo(function EmptyState({
  emoji = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Box flex={1} alignItems="center" justifyContent="center" padding="xl">
      <Text style={{ fontSize: 64 }}>{emoji}</Text>
      <Text variant="h3" textAlign="center" marginTop="m">
        {title}
      </Text>
      {description && (
        <Text variant="bodySmall" textAlign="center" marginTop="s" color="textSecondary">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Box marginTop="l" width={220}>
          <Button label={actionLabel} onPress={onAction} fullWidth />
        </Box>
      )}
    </Box>
  );
});

export default EmptyState;
