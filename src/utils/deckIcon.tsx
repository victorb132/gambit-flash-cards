import React from 'react';
import { View } from 'react-native';
import {
  Code,
  Globe,
  Atom,
  Books,
  Brain,
  Flask,
  Translate,
  Trophy,
  MusicNote,
  Palette,
  BookOpen,
  Lightbulb,
  ChartBar,
  PuzzlePiece,
  Heartbeat,
} from 'phosphor-react-native';
import { AppColors } from '../theme/colors';

type IconComponent = React.ComponentType<{ size: number; color: string; weight?: string }>;

const EMOJI_ICON_MAP: Record<string, IconComponent> = {
  '💻': Code,
  '🖥️': Code,
  '🌍': Globe,
  '🌎': Globe,
  '🌏': Globe,
  '🌐': Globe,
  '🧬': Atom,
  '⚛️': Atom,
  '⚗️': Flask,
  '🔬': Flask,
  '📚': Books,
  '📖': BookOpen,
  '📝': BookOpen,
  '🧠': Brain,
  '💡': Lightbulb,
  '📊': ChartBar,
  '🔢': ChartBar,
  '🗣️': Translate,
  '🏆': Trophy,
  '🥇': Trophy,
  '🎵': MusicNote,
  '🎶': MusicNote,
  '🎨': Palette,
  '🧩': PuzzlePiece,
  '❤️': Heartbeat,
  '🫀': Heartbeat,
};

export function getDeckIcon(emoji: string): IconComponent {
  return EMOJI_ICON_MAP[emoji] ?? Books;
}

export function getDeckAccentColor(deckId: string, colors: AppColors): string {
  const sum = deckId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palette = [colors.primaryDark, colors.primary, colors.primaryLight];
  return palette[sum % palette.length];
}

interface DeckIconBoxProps {
  emoji: string;
  deckId: string;
  size?: number;
  boxSize?: number;
  borderRadius?: number;
  colors: AppColors;
}

/** Reusable deck icon box — vector icon on palette-colored background */
export function DeckIconBox({
  emoji,
  deckId,
  size = 26,
  boxSize = 52,
  borderRadius = 10,
  colors,
}: DeckIconBoxProps) {
  const Icon = getDeckIcon(emoji);
  const bg = getDeckAccentColor(deckId, colors);
  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size} color={colors.surfaceLight} weight="fill" />
    </View>
  );
}
