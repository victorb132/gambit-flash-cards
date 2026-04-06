import { StudyResult } from './study';

export interface FlashCardStats {
  timesStudied: number;
  timesCorrect: number;
  timesWrong: number;
  timesDoubt: number;
  lastResult?: StudyResult;
  lastStudiedAt?: string;
}

export interface FlashCard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
  stats: FlashCardStats;
}
