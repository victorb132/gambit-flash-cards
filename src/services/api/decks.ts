import { USE_MOCK } from '../../utils/constants';
import { Deck, CreateDeckRequest, CreateDeckResponse } from '../../types/deck';
import {
  mockGetDecks,
  mockGetDeck,
  mockCreateDeck,
  mockCreateManualDeck,
  mockUpdateDeck,
  mockDeleteDeck,
} from '../mock/handlers';
import apiClient from './client';

export async function getDecks(): Promise<{ decks: Deck[] }> {
  if (USE_MOCK) return mockGetDecks();
  const response = await apiClient.get<{ decks: Deck[] }>('/decks');
  return response.data;
}

export async function getDeck(deckId: string): Promise<{ deck: Deck }> {
  if (USE_MOCK) return mockGetDeck(deckId);
  const response = await apiClient.get<{ deck: Deck }>(`/decks/${deckId}`);
  return response.data;
}

export async function createDeck(data: CreateDeckRequest): Promise<CreateDeckResponse> {
  if (USE_MOCK) return mockCreateDeck(data);
  const response = await apiClient.post<CreateDeckResponse>('/decks', data);
  return response.data;
}

export async function createManualDeck(
  title: string,
  description: string | undefined,
  emoji: string,
  cards: { question: string; answer: string; questionImage?: string; answerImage?: string }[]
): Promise<CreateDeckResponse> {
  if (USE_MOCK) return mockCreateManualDeck(title, description, emoji, cards);
  const response = await apiClient.post<CreateDeckResponse>('/decks/manual', {
    title,
    description,
    coverEmoji: emoji,
    cards,
  });
  return response.data;
}

export async function updateDeck(
  deckId: string,
  patch: { title: string; description: string; coverEmoji: string }
): Promise<{ deck: Deck }> {
  if (USE_MOCK) return mockUpdateDeck(deckId, patch);
  const response = await apiClient.put<{ deck: Deck }>(`/decks/${deckId}`, patch);
  return response.data;
}

export async function deleteDeck(deckId: string): Promise<{ message: string }> {
  if (USE_MOCK) return mockDeleteDeck(deckId);
  const response = await apiClient.delete<{ message: string }>(`/decks/${deckId}`);
  return response.data;
}
