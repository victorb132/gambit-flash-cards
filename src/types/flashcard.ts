import { StudyResult } from '@/types/study';
import { SRSData } from '@/utils/srs';

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
  questionImage?: string;
  answerImage?: string;
  order: number;
  createdAt: string;
  stats: FlashCardStats;
  srs?: SRSData;
}
