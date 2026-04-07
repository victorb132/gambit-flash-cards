import { USE_MOCK } from '../../utils/constants';
import { FlashCard } from '../../types/flashcard';
import { StudySession, StudyResult, StudySessionSummary } from '../../types/study';
import {
  mockGetFlashcards,
  mockUpdateFlashcard,
  mockCreateFlashcard,
  mockStartStudySession,
  mockAnswerCard,
  mockCompleteSession,
} from '../mock/handlers';
import apiClient from './client';

export async function getFlashcards(deckId: string): Promise<{ flashcards: FlashCard[] }> {
  if (USE_MOCK) return mockGetFlashcards(deckId);
  const response = await apiClient.get<{ flashcards: FlashCard[] }>(
    `/decks/${deckId}/flashcards`
  );
  return response.data;
}

export async function updateFlashcard(
  deckId: string,
  flashcardId: string,
  question: string,
  answer: string,
  questionImage?: string,
  answerImage?: string
): Promise<{ flashcard: FlashCard }> {
  if (USE_MOCK) return mockUpdateFlashcard(deckId, flashcardId, question, answer, questionImage, answerImage);
  const response = await apiClient.put<{ flashcard: FlashCard }>(
    `/decks/${deckId}/flashcards/${flashcardId}`,
    { question, answer, questionImage, answerImage }
  );
  return response.data;
}

export async function createFlashcard(
  deckId: string,
  question: string,
  answer: string,
  questionImage?: string,
  answerImage?: string
): Promise<{ flashcard: FlashCard }> {
  if (USE_MOCK) return mockCreateFlashcard(deckId, question, answer, questionImage, answerImage);
  const response = await apiClient.post<{ flashcard: FlashCard }>(
    `/decks/${deckId}/flashcards`,
    { question, answer, questionImage, answerImage }
  );
  return response.data;
}

export async function startStudySession(deckId: string): Promise<{ session: StudySession }> {
  if (USE_MOCK) return mockStartStudySession(deckId);
  const response = await apiClient.post<{ session: StudySession }>(
    `/decks/${deckId}/study/start`
  );
  return response.data;
}

export async function answerCard(
  sessionId: string,
  payload: { flashcardId: string; result: StudyResult; timeSpentMs: number }
): Promise<{ updated: boolean }> {
  if (USE_MOCK) return mockAnswerCard(sessionId, payload);
  const response = await apiClient.post<{ updated: boolean }>(
    `/study/${sessionId}/answer`,
    payload
  );
  return response.data;
}

export async function completeSession(
  sessionId: string
): Promise<{ summary: StudySessionSummary }> {
  if (USE_MOCK) return mockCompleteSession(sessionId);
  const response = await apiClient.post<{ summary: StudySessionSummary }>(
    `/study/${sessionId}/complete`
  );
  return response.data;
}
