import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

export interface StudyDay {
  date: string; // YYYY-MM-DD
  cardsStudied: number;
  correct: number;
  wrong: number;
  doubt: number;
  timeMs: number;
}

interface PersistedStats {
  history: StudyDay[];
  longestStreak: number;
  totalCardsStudied: number;
  totalCorrect: number;
  totalTimeMs: number;
}

interface StatsState extends PersistedStats {
  streak: number;
  isLoaded: boolean;
  loadStats: () => Promise<void>;
  recordSession: (summary: {
    totalCards: number;
    correct: number;
    wrong: number;
    doubt: number;
    totalTimeMs: number;
  }) => Promise<void>;
}

function calculateStreak(history: StudyDay[]): number {
  if (history.length === 0) return 0;
  const dates = new Set(history.map((d) => d.date));
  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  // Allow today or yesterday as the start
  const todayStr = cursor.toISOString().split('T')[0];
  if (!dates.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (dates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

const DEFAULT: PersistedStats = {
  history: [],
  longestStreak: 0,
  totalCardsStudied: 0,
  totalCorrect: 0,
  totalTimeMs: 0,
};

export const useStatsStore = create<StatsState>((set, get) => ({
  ...DEFAULT,
  streak: 0,
  isLoaded: false,

  loadStats: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      if (raw) {
        const data: PersistedStats = JSON.parse(raw);
        const streak = calculateStreak(data.history ?? []);
        set({ ...data, streak, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  recordSession: async (summary) => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    const history = [...state.history];

    const idx = history.findIndex((d) => d.date === today);
    if (idx >= 0) {
      history[idx] = {
        date: today,
        cardsStudied: history[idx].cardsStudied + summary.totalCards,
        correct: history[idx].correct + summary.correct,
        wrong: history[idx].wrong + summary.wrong,
        doubt: history[idx].doubt + summary.doubt,
        timeMs: history[idx].timeMs + summary.totalTimeMs,
      };
    } else {
      history.push({
        date: today,
        cardsStudied: summary.totalCards,
        correct: summary.correct,
        wrong: summary.wrong,
        doubt: summary.doubt,
        timeMs: summary.totalTimeMs,
      });
    }

    // Keep last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const trimmed = history.filter((d) => d.date >= cutoffStr);

    const streak = calculateStreak(trimmed);
    const longestStreak = Math.max(state.longestStreak, streak);
    const totalCardsStudied = state.totalCardsStudied + summary.totalCards;
    const totalCorrect = state.totalCorrect + summary.correct;
    const totalTimeMs = state.totalTimeMs + summary.totalTimeMs;

    const persisted: PersistedStats = {
      history: trimmed,
      longestStreak,
      totalCardsStudied,
      totalCorrect,
      totalTimeMs,
    };
    set({ ...persisted, streak, isLoaded: true });
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(persisted));
  },
}));
