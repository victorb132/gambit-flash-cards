import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, MOCK_CREDENTIALS } from '../../utils/constants';
import { LoginRequest, RegisterRequest, LoginResponse, User } from '../../types/auth';
import { Deck, CreateDeckRequest, CreateDeckResponse } from '../../types/deck';
import { FlashCard } from '../../types/flashcard';
import { StudySession, StudyCardResult, StudyResult, StudySessionSummary } from '../../types/study';
import { simulateDelay, simulateAIDelay } from './delay';
import { SEED_DECKS, SEED_FLASHCARDS, FLASHCARD_TEMPLATES, matchPromptToTemplate } from './data';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

class MockError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'MockError';
  }
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

async function getDecks(): Promise<Deck[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MOCK_DECKS);
  if (!raw) {
    // Seed initial data on first access
    await AsyncStorage.setItem(STORAGE_KEYS.MOCK_DECKS, JSON.stringify(SEED_DECKS));
    return SEED_DECKS;
  }
  return JSON.parse(raw);
}

async function saveDecks(decks: Deck[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.MOCK_DECKS, JSON.stringify(decks));
}

async function getFlashcards(): Promise<Record<string, FlashCard[]>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MOCK_FLASHCARDS);
  if (!raw) {
    await AsyncStorage.setItem(STORAGE_KEYS.MOCK_FLASHCARDS, JSON.stringify(SEED_FLASHCARDS));
    return SEED_FLASHCARDS;
  }
  return JSON.parse(raw);
}

async function saveFlashcards(all: Record<string, FlashCard[]>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.MOCK_FLASHCARDS, JSON.stringify(all));
}

async function getSessions(): Promise<Record<string, StudySession>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MOCK_SESSIONS);
  return raw ? JSON.parse(raw) : {};
}

async function saveSessions(sessions: Record<string, StudySession>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.MOCK_SESSIONS, JSON.stringify(sessions));
}

// ─── Auth handlers ───────────────────────────────────────────────────────────

export async function mockLogin(data: LoginRequest): Promise<LoginResponse> {
  await simulateDelay();
  if (
    data.email.toLowerCase() !== MOCK_CREDENTIALS.EMAIL ||
    data.password !== MOCK_CREDENTIALS.PASSWORD
  ) {
    throw new MockError('Credenciais inválidas. Tente usuario@gambit.com / 123456', 401);
  }
  const user: User = {
    id: 'user-1',
    name: 'Usuário Gambit',
    email: MOCK_CREDENTIALS.EMAIL,
    avatarUrl: undefined,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
  return {
    user,
    token: `mock-jwt-token-${generateId()}`,
    refreshToken: `mock-refresh-token-${generateId()}`,
  };
}

export async function mockGetMe(_token: string): Promise<User> {
  await simulateDelay(100, 300);
  return {
    id: 'user-1',
    name: 'Usuário Gambit',
    email: MOCK_CREDENTIALS.EMAIL,
    avatarUrl: undefined,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

export async function mockRegister(data: RegisterRequest): Promise<LoginResponse> {
  await simulateDelay();
  const user: User = {
    id: `user-${generateId()}`,
    name: data.name,
    email: data.email.toLowerCase(),
    avatarUrl: undefined,
    createdAt: new Date().toISOString(),
  };
  return {
    user,
    token: `mock-jwt-token-${generateId()}`,
    refreshToken: `mock-refresh-token-${generateId()}`,
  };
}

export async function mockLogout(): Promise<{ message: string }> {
  await simulateDelay(100, 200);
  return { message: 'Logout realizado com sucesso.' };
}

// ─── Deck handlers ────────────────────────────────────────────────────────────

export async function mockGetDecks(): Promise<{ decks: Deck[] }> {
  await simulateDelay();
  const decks = await getDecks();
  return { decks };
}

export async function mockGetDeck(deckId: string): Promise<{ deck: Deck }> {
  await simulateDelay();
  const decks = await getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) throw new MockError('Deck não encontrado.', 404);
  return { deck };
}

export async function mockCreateDeck(data: CreateDeckRequest): Promise<CreateDeckResponse> {
  await simulateAIDelay();

  const decks = await getDecks();
  const allFlashcards = await getFlashcards();

  // Duplicate title check
  if (decks.some((d) => d.title.toLowerCase() === data.title.toLowerCase())) {
    throw new MockError('Já existe um deck com esse título.', 409);
  }

  const deckId = `deck-${generateId()}`;
  const numberOfCards = Math.min(Math.max(data.numberOfCards ?? 10, 5), 30);

  // Select template based on prompt keyword matching
  const topic = matchPromptToTemplate(data.prompt);
  const templates = FLASHCARD_TEMPLATES[topic];

  // Build flashcards from template (repeat if necessary to reach numberOfCards)
  const flashcards: FlashCard[] = [];
  for (let i = 0; i < numberOfCards; i++) {
    const tpl = templates[i % templates.length];
    flashcards.push({
      id: `fc-${deckId}-${i + 1}`,
      deckId,
      question: tpl.question,
      answer: tpl.answer,
      order: i + 1,
      createdAt: new Date().toISOString(),
      stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
    });
  }

  const deck: Deck = {
    id: deckId,
    title: data.title,
    description: data.description,
    coverEmoji: '📚',
    cardCount: flashcards.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastStudiedAt: undefined,
    progress: {
      totalCards: flashcards.length,
      mastered: 0,
      learning: 0,
      notStarted: flashcards.length,
      completionPercentage: 0,
    },
  };

  await saveDecks([...decks, deck]);
  await saveFlashcards({ ...allFlashcards, [deckId]: flashcards });

  return { deck, flashcards };
}

export async function mockDeleteDeck(deckId: string): Promise<{ message: string }> {
  await simulateDelay();
  const decks = await getDecks();
  const updated = decks.filter((d) => d.id !== deckId);
  if (updated.length === decks.length) throw new MockError('Deck não encontrado.', 404);
  await saveDecks(updated);

  const allFlashcards = await getFlashcards();
  delete allFlashcards[deckId];
  await saveFlashcards(allFlashcards);

  return { message: 'Deck deletado com sucesso.' };
}

// ─── Flashcard handlers ───────────────────────────────────────────────────────

export async function mockGetFlashcards(deckId: string): Promise<{ flashcards: FlashCard[] }> {
  await simulateDelay();
  const allFlashcards = await getFlashcards();
  const flashcards = allFlashcards[deckId] ?? [];
  return { flashcards };
}

export async function mockUpdateFlashcard(
  deckId: string,
  flashcardId: string,
  question: string,
  answer: string
): Promise<{ flashcard: FlashCard }> {
  await simulateDelay(150, 300);
  const allFlashcards = await getFlashcards();
  const cards = allFlashcards[deckId] ?? [];
  const idx = cards.findIndex((c) => c.id === flashcardId);
  if (idx === -1) throw new MockError('Flashcard não encontrado.', 404);
  cards[idx] = { ...cards[idx], question, answer };
  allFlashcards[deckId] = cards;
  await saveFlashcards(allFlashcards);
  return { flashcard: cards[idx] };
}

// ─── Study handlers ───────────────────────────────────────────────────────────

export async function mockStartStudySession(deckId: string): Promise<{ session: StudySession }> {
  await simulateDelay(200, 400);
  const session: StudySession = {
    id: `session-${generateId()}`,
    deckId,
    startedAt: new Date().toISOString(),
    results: [],
  };
  const sessions = await getSessions();
  await saveSessions({ ...sessions, [session.id]: session });
  return { session };
}

export async function mockAnswerCard(
  sessionId: string,
  payload: { flashcardId: string; result: StudyResult; timeSpentMs: number }
): Promise<{ updated: boolean }> {
  await simulateDelay(100, 300);
  const sessions = await getSessions();
  const session = sessions[sessionId];
  if (!session) throw new MockError('Sessão não encontrada.', 404);

  const cardResult: StudyCardResult = {
    flashcardId: payload.flashcardId,
    result: payload.result,
    answeredAt: new Date().toISOString(),
    timeSpentMs: payload.timeSpentMs,
  };
  session.results.push(cardResult);
  await saveSessions({ ...sessions, [sessionId]: session });

  // Update flashcard stats
  const allFlashcards = await getFlashcards();
  const deckCards = allFlashcards[session.deckId];
  if (deckCards) {
    const card = deckCards.find((c) => c.id === payload.flashcardId);
    if (card) {
      card.stats.timesStudied += 1;
      card.stats.lastResult = payload.result;
      card.stats.lastStudiedAt = new Date().toISOString();
      if (payload.result === 'correct') card.stats.timesCorrect += 1;
      else if (payload.result === 'wrong') card.stats.timesWrong += 1;
      else card.stats.timesDoubt += 1;
      await saveFlashcards(allFlashcards);
    }
  }

  return { updated: true };
}

export async function mockCompleteSession(
  sessionId: string
): Promise<{ summary: StudySessionSummary }> {
  await simulateDelay(200, 400);
  const sessions = await getSessions();
  const session = sessions[sessionId];
  if (!session) throw new MockError('Sessão não encontrada.', 404);

  session.completedAt = new Date().toISOString();
  await saveSessions({ ...sessions, [sessionId]: session });

  // Update deck progress and lastStudiedAt
  const results = session.results;
  const correct = results.filter((r) => r.result === 'correct').length;
  const wrong = results.filter((r) => r.result === 'wrong').length;
  const doubt = results.filter((r) => r.result === 'doubt').length;
  const totalTimeMs = results.reduce((acc, r) => acc + r.timeSpentMs, 0);
  const total = results.length;

  // Update deck progress in storage
  const decks = await getDecks();
  const deck = decks.find((d) => d.id === session.deckId);
  if (deck) {
    deck.lastStudiedAt = new Date().toISOString();
    deck.progress = {
      totalCards: deck.cardCount,
      mastered: correct,
      learning: wrong + doubt,
      notStarted: Math.max(0, deck.cardCount - total),
      completionPercentage: deck.cardCount > 0 ? Math.round((correct / deck.cardCount) * 100) : 0,
    };
    await saveDecks(decks);
  }

  const summary: StudySessionSummary = {
    totalCards: total,
    correct,
    wrong,
    doubt,
    totalTimeMs,
    averageTimePerCardMs: total > 0 ? Math.round(totalTimeMs / total) : 0,
  };

  return { summary };
}
