import { FlashCard } from './flashcard';

export interface DeckProgress {
  totalCards: number;
  /** Cards answered correctly consistently */
  mastered: number;
  /** Cards still being learned (wrong or doubt) */
  learning: number;
  /** Cards never studied */
  notStarted: number;
  /** 0–100 */
  completionPercentage: number;
  /** Cards due for review today (SRS) */
  dueCount: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  /** Emoji representing this deck */
  coverEmoji: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  lastStudiedAt?: string;
  progress: DeckProgress;
}

export interface CreateDeckRequest {
  title: string;
  description: string;
  /** Free-text prompt for AI to generate flashcards */
  prompt: string;
  /** Desired number of cards (default: 10) */
  numberOfCards?: number;
}

export interface CreateDeckResponse {
  deck: Deck;
  flashcards: FlashCard[];
}
