import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, MOCK_CREDENTIALS } from '../../utils/constants';
import { LoginRequest, RegisterRequest, LoginResponse, User } from '../../types/auth';
import { Deck, CreateDeckRequest, CreateDeckResponse } from '../../types/deck';
import { FlashCard } from '../../types/flashcard';
import { StudySession, StudyCardResult, StudyResult, StudySessionSummary } from '../../types/study';
import { simulateDelay, simulateAIDelay } from './delay';
import { SEED_DECKS, SEED_FLASHCARDS, FLASHCARD_TEMPLATES, matchPromptToTemplate } from './data';
import { calculateNextSRS, getInitialSRS, getDueCount } from '../../utils/srs';

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
    const seeded = SEED_DECKS.map((d) => ({ ...d, progress: { ...d.progress, dueCount: d.progress.dueCount ?? d.progress.totalCards } }));
    await AsyncStorage.setItem(STORAGE_KEYS.MOCK_DECKS, JSON.stringify(seeded));
    return seeded;
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
  const allFlashcards = await getFlashcards();
  // Recompute all progress fields from actual SRS data on every read
  const updated = decks.map((d) => {
    const cards = allFlashcards[d.id] ?? [];
    const mastered = cards.filter((c) => (c.srs?.interval ?? 0) >= 7).length;
    const notStarted = cards.filter((c) => c.stats.timesStudied === 0).length;
    const learning = Math.max(0, d.cardCount - mastered - notStarted);
    return {
      ...d,
      progress: {
        ...d.progress,
        mastered,
        learning,
        notStarted,
        completionPercentage: d.cardCount > 0 ? Math.round((mastered / d.cardCount) * 100) : 0,
        dueCount: getDueCount(cards),
      },
    };
  });
  return { decks: updated };
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

  if (decks.some((d) => d.title.toLowerCase() === data.title.toLowerCase())) {
    throw new MockError('Já existe um deck com esse título.', 409);
  }

  const deckId = `deck-${generateId()}`;
  const numberOfCards = Math.min(Math.max(data.numberOfCards ?? 10, 5), 30);
  const topic = matchPromptToTemplate(data.prompt);
  const templates = FLASHCARD_TEMPLATES[topic];

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
      srs: getInitialSRS(),
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
      dueCount: flashcards.length,
    },
  };

  await saveDecks([...decks, deck]);
  await saveFlashcards({ ...allFlashcards, [deckId]: flashcards });

  return { deck, flashcards };
}

export async function mockCreateManualDeck(
  title: string,
  description: string | undefined,
  emoji: string,
  cards: { question: string; answer: string; questionImage?: string; answerImage?: string }[]
): Promise<CreateDeckResponse> {
  await simulateDelay();

  const decks = await getDecks();
  const allFlashcards = await getFlashcards();

  if (decks.some((d) => d.title.toLowerCase() === title.toLowerCase())) {
    throw new MockError('Já existe um deck com esse título.', 409);
  }

  const deckId = `deck-${generateId()}`;

  const flashcards: FlashCard[] = cards.map((c, i) => ({
    id: `fc-${deckId}-${i + 1}`,
    deckId,
    question: c.question,
    answer: c.answer,
    questionImage: c.questionImage,
    answerImage: c.answerImage,
    order: i + 1,
    createdAt: new Date().toISOString(),
    stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
    srs: getInitialSRS(),
  }));

  const deck: Deck = {
    id: deckId,
    title,
    description: description ?? '',
    coverEmoji: emoji,
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
      dueCount: flashcards.length,
    },
  };

  await saveDecks([...decks, deck]);
  await saveFlashcards({ ...allFlashcards, [deckId]: flashcards });

  return { deck, flashcards };
}

export async function mockUpdateDeck(
  deckId: string,
  patch: { title: string; description: string; coverEmoji: string }
): Promise<{ deck: Deck }> {
  await simulateDelay(150, 300);
  const decks = await getDecks();
  const idx = decks.findIndex((d) => d.id === deckId);
  if (idx === -1) throw new MockError('Deck não encontrado.', 404);
  // Duplicate title check (exclude self)
  if (decks.some((d) => d.id !== deckId && d.title.toLowerCase() === patch.title.toLowerCase())) {
    throw new MockError('Já existe um deck com esse título.', 409);
  }
  decks[idx] = { ...decks[idx], ...patch, updatedAt: new Date().toISOString() };
  await saveDecks(decks);
  return { deck: decks[idx] };
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

export async function mockCreateFlashcard(
  deckId: string,
  question: string,
  answer: string,
  questionImage?: string,
  answerImage?: string
): Promise<{ flashcard: FlashCard }> {
  await simulateDelay(150, 300);

  const allFlashcards = await getFlashcards();
  const cards = allFlashcards[deckId] ?? [];

  const newCard: FlashCard = {
    id: `fc-${deckId}-${generateId()}`,
    deckId,
    question,
    answer,
    questionImage,
    answerImage,
    order: cards.length + 1,
    createdAt: new Date().toISOString(),
    stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
    srs: getInitialSRS(),
  };

  allFlashcards[deckId] = [...cards, newCard];
  await saveFlashcards(allFlashcards);

  const decks = await getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (deck) {
    deck.cardCount += 1;
    deck.updatedAt = new Date().toISOString();
    if (deck.progress) {
      deck.progress.totalCards += 1;
      deck.progress.notStarted += 1;
      deck.progress.dueCount = getDueCount(allFlashcards[deckId]);
    }
    await saveDecks(decks);
  }

  return { flashcard: newCard };
}

export async function mockUpdateFlashcard(
  deckId: string,
  flashcardId: string,
  question: string,
  answer: string,
  questionImage?: string,
  answerImage?: string
): Promise<{ flashcard: FlashCard }> {
  await simulateDelay(150, 300);
  const allFlashcards = await getFlashcards();
  const cards = allFlashcards[deckId] ?? [];
  const idx = cards.findIndex((c) => c.id === flashcardId);
  if (idx === -1) throw new MockError('Flashcard não encontrado.', 404);
  cards[idx] = { ...cards[idx], question, answer, questionImage, answerImage };
  allFlashcards[deckId] = cards;
  await saveFlashcards(allFlashcards);
  return { flashcard: cards[idx] };
}

export async function mockDeleteFlashcard(
  deckId: string,
  flashcardId: string
): Promise<{ message: string }> {
  await simulateDelay(150, 300);
  const allFlashcards = await getFlashcards();
  const cards = allFlashcards[deckId] ?? [];
  const updated = cards.filter((c) => c.id !== flashcardId);
  if (updated.length === cards.length) throw new MockError('Flashcard não encontrado.', 404);
  allFlashcards[deckId] = updated;
  await saveFlashcards(allFlashcards);

  const decks = await getDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (deck) {
    deck.cardCount = Math.max(0, deck.cardCount - 1);
    deck.updatedAt = new Date().toISOString();
    if (deck.progress) {
      deck.progress.totalCards = deck.cardCount;
      deck.progress.dueCount = getDueCount(updated);
    }
    await saveDecks(decks);
  }

  return { message: 'Flashcard deletado com sucesso.' };
}

export async function mockResetFlashcardSRS(
  deckId: string,
  flashcardId: string
): Promise<{ flashcard: FlashCard }> {
  await simulateDelay(100, 200);
  const allFlashcards = await getFlashcards();
  const cards = allFlashcards[deckId] ?? [];
  const idx = cards.findIndex((c) => c.id === flashcardId);
  if (idx === -1) throw new MockError('Flashcard não encontrado.', 404);
  cards[idx] = {
    ...cards[idx],
    srs: getInitialSRS(),
    stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
  };
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
): Promise<{ updated: boolean; nextSRS: ReturnType<typeof calculateNextSRS> }> {
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

  // Update flashcard stats + SRS
  const allFlashcards = await getFlashcards();
  const deckCards = allFlashcards[session.deckId];
  let nextSRS = getInitialSRS();
  if (deckCards) {
    const card = deckCards.find((c) => c.id === payload.flashcardId);
    if (card) {
      nextSRS = calculateNextSRS(card.srs ?? getInitialSRS(), payload.result);
      card.srs = nextSRS;
      card.stats.timesStudied += 1;
      card.stats.lastResult = payload.result;
      card.stats.lastStudiedAt = new Date().toISOString();
      if (payload.result === 'correct') card.stats.timesCorrect += 1;
      else if (payload.result === 'wrong') card.stats.timesWrong += 1;
      else card.stats.timesDoubt += 1;
      await saveFlashcards(allFlashcards);
    }
  }

  return { updated: true, nextSRS };
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

  const results = session.results;
  const correct = results.filter((r) => r.result === 'correct').length;
  const wrong = results.filter((r) => r.result === 'wrong').length;
  const doubt = results.filter((r) => r.result === 'doubt').length;
  const totalTimeMs = results.reduce((acc, r) => acc + r.timeSpentMs, 0);
  const total = results.length;

  const allFlashcards = await getFlashcards();
  const deckCards = allFlashcards[session.deckId] ?? [];

  const decks = await getDecks();
  const deck = decks.find((d) => d.id === session.deckId);
  if (deck) {
    deck.lastStudiedAt = new Date().toISOString();
    // Derive mastery from SRS data, not session counts
    const mastered = deckCards.filter((c) => (c.srs?.interval ?? 0) >= 7).length;
    const notStarted = deckCards.filter((c) => c.stats.timesStudied === 0).length;
    const learning = Math.max(0, deck.cardCount - mastered - notStarted);
    deck.progress = {
      totalCards: deck.cardCount,
      mastered,
      learning,
      notStarted,
      completionPercentage: deck.cardCount > 0 ? Math.round((mastered / deck.cardCount) * 100) : 0,
      dueCount: getDueCount(deckCards),
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
