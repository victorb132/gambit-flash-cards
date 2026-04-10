import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "@shopify/restyle";
import { Trash } from "phosphor-react-native";
import Box from "../ui/Box";
import Text from "../ui/Text";
import ProgressBar from "../ui/ProgressBar";
import { Deck } from "../../types/deck";
import { formatRelativeDate } from "../../utils/formatters";
import { DeckIconBox } from "../../utils/deckIcon";
import { Theme } from "../../theme";

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  onDelete: () => void;
}

const DeckCard = React.memo(function DeckCard({
  deck,
  onPress,
  onDelete,
}: DeckCardProps) {
  const theme = useTheme<Theme>();
  const { progress } = deck;
  const dueCount = progress.dueCount ?? 0;

  const segments = [
    { value: progress.mastered, color: "success" as keyof Theme["colors"] },
    { value: progress.learning, color: "warning" as keyof Theme["colors"] },
    { value: progress.notStarted, color: "border" as keyof Theme["colors"] },
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityLabel={`Deck ${deck.title}`}
    >
      <Box
        backgroundColor="white"
        borderRadius="m"
        padding="m"
        marginBottom="s"
        style={{ borderWidth: 1, borderColor: theme.colors.border }}
      >
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box flexDirection="row" alignItems="center" flex={1}>
            <DeckIconBox
              emoji={deck.coverEmoji}
              deckId={deck.id}
              colors={theme.colors}
            />
            <Box marginLeft="m" flex={1}>
              <Box flexDirection="row" alignItems="center" style={{ gap: 8 }}>
                <Text variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                  {deck.title}
                </Text>
              </Box>
              <Text variant="caption" color="textSecondary" marginTop="xs">
                {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"} ·{" "}
                {formatRelativeDate(deck.lastStudiedAt)}
              </Text>
            </Box>
          </Box>
          {dueCount > 0 && (
            <View
              style={{
                backgroundColor: theme.colors.primaryDark,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
                minWidth: 24,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Poppins_600SemiBold",
                  color: theme.colors.surfaceLight,
                }}
              >
                {dueCount}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={`Deletar deck ${deck.title}`}
            style={{ marginLeft: 8 }}
          >
            <Trash size={17} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Box>

        <Box marginTop="m">
          <ProgressBar segments={segments} height={3} />
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
