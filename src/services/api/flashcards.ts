import { USE_MOCK } from '@/utils/constants';
import { FlashCard } from '@/types/flashcard';
import { StudySession, StudyResult, StudySessionSummary } from '@/types/study';
import { SRSData } from '@/utils/srs';
import {
  mockGetFlashcards,
  mockUpdateFlashcard,
  mockCreateFlashcard,
  mockDeleteFlashcard,
  mockResetFlashcardSRS,
  mockStartStudySession,
  mockAnswerCard,
  mockCompleteSession,
} from '@/services/mock/handlers';
import apiClient from '@/services/api/client';

export async function getFlashcards(deckId: string): Promise<{ flashcards: FlashCard[] }> {
  if (USE_MOCK) return mockGetFlashcards(deckId);
  const response = await apiClient.get<{ flashcards: FlashCard[] }>(`/decks/${deckId}/flashcards`);
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

export async function deleteFlashcard(
  deckId: string,
  flashcardId: string
): Promise<{ message: string }> {
  if (USE_MOCK) return mockDeleteFlashcard(deckId, flashcardId);
  const response = await apiClient.delete<{ message: string }>(
    `/decks/${deckId}/flashcards/${flashcardId}`
  );
  return response.data;
}

export async function resetFlashcardSRS(
  deckId: string,
  flashcardId: string
): Promise<{ flashcard: FlashCard }> {
  if (USE_MOCK) return mockResetFlashcardSRS(deckId, flashcardId);
  const response = await apiClient.post<{ flashcard: FlashCard }>(
    `/decks/${deckId}/flashcards/${flashcardId}/reset-srs`
  );
  return response.data;
}

export async function startStudySession(deckId: string): Promise<{ session: StudySession }> {
  if (USE_MOCK) return mockStartStudySession(deckId);
  const response = await apiClient.post<{ session: StudySession }>(`/decks/${deckId}/study/start`);
  return response.data;
}

export async function answerCard(
  sessionId: string,
  payload: { flashcardId: string; result: StudyResult; timeSpentMs: number }
): Promise<{ updated: boolean; nextSRS: SRSData }> {
  if (USE_MOCK) return mockAnswerCard(sessionId, payload);
  const response = await apiClient.post<{ updated: boolean; nextSRS: SRSData }>(
    `/study/${sessionId}/answer`,
    payload
  );
  return response.data;
}

export async function completeSession(sessionId: string): Promise<{ summary: StudySessionSummary }> {
  if (USE_MOCK) return mockCompleteSession(sessionId);
  const response = await apiClient.post<{ summary: StudySessionSummary }>(
    `/study/${sessionId}/complete`
  );
  return response.data;
}
