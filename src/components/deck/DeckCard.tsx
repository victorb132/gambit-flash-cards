import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Trash } from 'phosphor-react-native';
import Box from '../ui/Box';
import Text from '../ui/Text';
import ProgressBar from '../ui/ProgressBar';
import { Deck } from '../../types/deck';
import { formatRelativeDate } from '../../utils/formatters';
import { Theme } from '../../theme';

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  onDelete: () => void;
}

/** Card displaying deck summary with progress bar and last studied date */
const DeckCard = React.memo(function DeckCard({ deck, onPress, onDelete }: DeckCardProps) {
  const theme = useTheme<Theme>();
  const { progress } = deck;

  const segments = [
    { value: progress.mastered, color: 'success' as keyof Theme['colors'] },
    { value: progress.learning, color: 'warning' as keyof Theme['colors'] },
    { value: progress.notStarted, color: 'border' as keyof Theme['colors'] },
  ];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityLabel={`Deck ${deck.title}`}>
      <Box
        backgroundColor="white"
        borderRadius="l"
        padding="m"
        marginBottom="m"
        style={{
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flexDirection="row" alignItems="center" flex={1}>
            <Box
              width={52}
              height={52}
              borderRadius="m"
              backgroundColor="surfaceLight"
              alignItems="center"
              justifyContent="center"
            >
              <Text style={{ fontSize: 28 }}>{deck.coverEmoji}</Text>
            </Box>
            <Box marginLeft="m" flex={1}>
              <Text variant="h3" numberOfLines={1}>
                {deck.title}
              </Text>
              <Text variant="caption" color="textSecondary" marginTop="xs">
                {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'} •{' '}
                {formatRelativeDate(deck.lastStudiedAt)}
              </Text>
            </Box>
          </Box>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={`Deletar deck ${deck.title}`}
          >
            <Trash size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Box>

        <Box marginTop="m">
          <ProgressBar segments={segments} height={6} />
        </Box>

        {progress.completionPercentage > 0 && (
          <Text variant="caption" color="success" marginTop="xs">
            {progress.completionPercentage}% dominado
          </Text>
        )}
      </Box>
    </TouchableOpacity>
  );
});

export default DeckCard;
