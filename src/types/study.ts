export type StudyResult = 'correct' | 'wrong' | 'doubt';

export interface StudySession {
  id: string;
  deckId: string;
  startedAt: string;
  completedAt?: string;
  results: StudyCardResult[];
}

export interface StudyCardResult {
  flashcardId: string;
  result: StudyResult;
  answeredAt: string;
  /** Time in milliseconds spent on this card */
  timeSpentMs: number;
}

export interface StudySessionSummary {
  totalCards: number;
  correct: number;
  wrong: number;
  doubt: number;
  totalTimeMs: number;
  averageTimePerCardMs: number;
}
