import { useReducer, useRef, useEffect, useCallback } from 'react';
import { useDeckStore } from '@/stores/deckStore';
import { useStatsStore } from '@/stores/statsStore';
import { getDecks, createDeck, deleteDeck } from '@/services/api/decks';
import { getFlashcards, createFlashcard, startStudySession, answerCard, completeSession } from '@/services/api/flashcards';
import { FlashCard } from '@/types/flashcard';
import { Deck } from '@/types/deck';
import { StudyResult } from '@/types/study';
import { useTTS } from '@/hooks/useTTS';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatState =
  | 'GREETING'
  | 'AWAITING_MAIN_OPTION'
  | 'CREATE_DECK__ASK_NAME'
  | 'CREATE_DECK__ASK_SUBJECT'
  | 'ADD_CARD__ASK_DECK'
  | 'ADD_CARD__ASK_SUBJECT'
  | 'LIST_DECKS'
  | 'DELETE_DECK__ASK_WHICH'
  | 'DELETE_DECK__CONFIRM'
  | 'STUDY__ASK_DECK'
  | 'STUDY__IN_PROGRESS'
  | 'STUDY__SELF_EVALUATE'
  | 'STUDY__FINISHED'
  | 'POST_ACTION__ASK_STUDY'
  | 'ERROR_RECOVERY';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
}

export interface MachineState {
  chatState: ChatState;
  messages: ChatMessage[];
  isProcessing: boolean;
  showTextInput: boolean;
  options: string[] | null;
  isConfirming: boolean;
  pendingDeckName: string | null;
  pendingDeck: Deck | null;
  studyCards: FlashCard[];
  currentCardIndex: number;
  studyResults: Array<{ flashcardId: string; result: StudyResult }>;
  studySessionId: string | null;
  failedVoiceAttempts: number;
  retryCount: number;
}

type Action =
  | { type: 'ADD_MSG'; msg: ChatMessage }
  | { type: 'PATCH'; data: Partial<MachineState> };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: MachineState, action: Action): MachineState {
  switch (action.type) {
    case 'ADD_MSG':
      return { ...state, messages: [...state.messages, action.msg] };
    case 'PATCH':
      return { ...state, ...action.data };
    default:
      return state;
  }
}

function getInitialState(): MachineState {
  return {
    chatState: 'GREETING',
    messages: [],
    isProcessing: false,
    showTextInput: false,
    options: null,
    isConfirming: false,
    pendingDeckName: null,
    pendingDeck: null,
    studyCards: [],
    currentCardIndex: 0,
    studyResults: [],
    studySessionId: null,
    failedVoiceAttempts: 0,
    retryCount: 0,
  };
}

// ─── NLP Helpers ──────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      dp[i][j] = i === 0 ? j : j === 0 ? i : 0;
    }
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function findDeck(decks: Deck[], query: string): Deck | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const exact = decks.find((d) => d.title.toLowerCase() === q);
  if (exact) return exact;

  const includes = decks.find(
    (d) => d.title.toLowerCase().includes(q) || q.includes(d.title.toLowerCase())
  );
  if (includes) return includes;

  let best: Deck | null = null;
  let bestScore = Infinity;
  for (const deck of decks) {
    const score = levenshtein(deck.title.toLowerCase(), q);
    const threshold = Math.floor(Math.max(deck.title.length, q.length) * 0.4);
    if (score <= threshold && score < bestScore) {
      bestScore = score;
      best = deck;
    }
  }
  return best;
}

type Intent = 'CREATE_DECK' | 'LIST_DECKS' | 'DELETE_DECK' | 'ADD_CARD' | 'STUDY' | 'UNKNOWN';

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/criar\s*deck|novo\s*deck|criar\s*um\s*deck/.test(t)) return 'CREATE_DECK';
  if (/listar|ver\s*deck|meus\s*deck|mostrar\s*deck|lista/.test(t)) return 'LIST_DECKS';
  if (/excluir|deletar|apagar|remover/.test(t)) return 'DELETE_DECK';
  if (/adicionar|novo\s*flash|cadastrar|criar\s*flash/.test(t)) return 'ADD_CARD';
  if (/estudar|quero\s*estudar|revisar|começar/.test(t)) return 'STUDY';
  return 'UNKNOWN';
}

function isYes(text: string): boolean {
  return /\b(sim|claro|pode|quero|vamos|ok|bora|isso|positivo|afirmativo|gostaria|por\s*favor)\b/.test(
    text.toLowerCase()
  );
}

function isNo(text: string): boolean {
  return /\b(não|nao|cancel|pare|agora\s*n[aã]o|deixa|negativo|obrigado|dispenso|n[aã]o\s*quero)\b/.test(
    text.toLowerCase()
  );
}

function detectStudyResult(text: string): StudyResult | null {
  const t = text.toLowerCase();
  if (/\b(acert|correto|certo|sabia|sei\b|lembrei)/.test(t)) return 'correct';
  if (/\b(err|errado|errei|n[aã]o\s*sabia|n[aã]o\s*sei|incorreto|esqueci)/.test(t)) return 'wrong';
  if (/\b(d[uú]vida|incerto|mais\s*ou\s*menos|talvez|n[aã]o\s*tenho\s*certeza)/.test(t)) return 'doubt';
  return null;
}

const MAIN_OPTION_HINTS =
  'Você pode dizer: "criar deck", "listar decks", "excluir deck", "adicionar flashcards" ou "estudar".';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatStateMachine(userName: string) {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const stateRef = useRef(state);
  stateRef.current = state;

  const isProcessingRef = useRef(false);

  const { speak, stop: stopTTS, isSpeaking } = useTTS();

  const {
    decks,
    setDecks,
    addDeck: storeAddDeck,
    removeDeck: storeRemoveDeck,
    addFlashcard: storeAddFlashcard,
    setFlashcards: storeSetFlashcards,
    updateFlashcardStats,
    updateDeckProgress,
  } = useDeckStore();

  const { recordSession } = useStatsStore();

  const decksRef = useRef(decks);
  decksRef.current = decks;

  // ─── Internal helpers ────────────────────────────────────────────────────

  function addMsg(role: 'assistant' | 'user', text: string) {
    dispatch({ type: 'ADD_MSG', msg: { id: uid(), role, text, timestamp: new Date() } });
  }

  function say(text: string) {
    addMsg('assistant', text);
    speak(text);
  }

  function patch(data: Partial<MachineState>) {
    dispatch({ type: 'PATCH', data });
  }

  function go(
    to: ChatState,
    extra?: Partial<Omit<MachineState, 'chatState' | 'messages'>>
  ) {
    dispatch({
      type: 'PATCH',
      data: {
        chatState: to,
        isProcessing: false,
        isConfirming: false,
        options: null,
        retryCount: 0,
        ...extra,
      },
    });
  }

  // ─── AWAITING_MAIN_OPTION ────────────────────────────────────────────────

  async function handleMainOption(text: string) {
    const intent = detectIntent(text);
    const cur = stateRef.current;

    switch (intent) {
      case 'CREATE_DECK':
        say('Qual será o nome do novo deck?');
        go('CREATE_DECK__ASK_NAME');
        break;

      case 'LIST_DECKS': {
        patch({ isProcessing: true });
        try {
          const { decks: loaded } = await getDecks();
          setDecks(loaded);
          if (loaded.length === 0) {
            say('Você ainda não tem nenhum deck. Gostaria de criar um? Diga "criar deck" para começar.');
            go('AWAITING_MAIN_OPTION');
          } else {
            const nameList = loaded.map((d) => d.title).join(', ');
            say(
              `Você tem ${loaded.length} deck${loaded.length > 1 ? 's' : ''}: ${nameList}. Qual deles você gostaria de estudar?`
            );
            go('LIST_DECKS');
          }
        } catch {
          say('Não consegui carregar seus decks. Tente novamente.');
          go('AWAITING_MAIN_OPTION');
        }
        break;
      }

      case 'DELETE_DECK':
        say('Qual deck você gostaria de excluir?');
        go('DELETE_DECK__ASK_WHICH');
        break;

      case 'ADD_CARD':
        say('Em qual deck você gostaria de adicionar os flashcards?');
        go('ADD_CARD__ASK_DECK');
        break;

      case 'STUDY':
        say('Qual deck você gostaria de estudar?');
        go('STUDY__ASK_DECK');
        break;

      default: {
        const newRetry = cur.retryCount + 1;
        if (newRetry >= 3) {
          say('Vou te mostrar as opções para facilitar.');
          patch({
            isProcessing: false,
            retryCount: 0,
            options: ['Criar deck', 'Listar decks', 'Excluir deck', 'Adicionar flashcards', 'Estudar'],
          });
        } else {
          say(`Não entendi bem. ${MAIN_OPTION_HINTS}`);
          patch({ isProcessing: false, retryCount: newRetry });
        }
      }
    }
  }

  // ─── CREATE DECK ─────────────────────────────────────────────────────────

  function handleCreateDeckAskName(text: string) {
    const name = text.trim();
    if (name.length < 2) {
      say('Não entendi o nome do deck. Pode repetir?');
      patch({ isProcessing: false });
      return;
    }
    say(
      `Perfeito! Sobre qual assunto você gostaria de estudar nesse deck? Posso gerar os flashcards automaticamente.`
    );
    go('CREATE_DECK__ASK_SUBJECT', { pendingDeckName: name });
  }

  async function handleCreateDeckAskSubject(text: string) {
    const subject = text.trim();
    const deckName = stateRef.current.pendingDeckName!;

    patch({ isProcessing: true });
    try {
      const { deck, flashcards } = await createDeck({
        title: deckName,
        description: subject,
        prompt: subject,
        numberOfCards: 10,
      });
      storeAddDeck(deck);
      storeSetFlashcards(deck.id, flashcards);

      say(
        `Criei o deck "${deck.title}" com ${flashcards.length} flashcards sobre ${subject}! Gostaria de começar a estudar agora?`
      );
      go('POST_ACTION__ASK_STUDY', { pendingDeck: deck, pendingDeckName: null, options: ['Sim', 'Não'] });
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? '';
      if (msg.includes('Já existe')) {
        say(`Já existe um deck chamado "${deckName}". Escolha um nome diferente.`);
        go('CREATE_DECK__ASK_NAME');
      } else {
        say('Não consegui criar o deck. Tente novamente.');
        go('AWAITING_MAIN_OPTION');
      }
    }
  }

  // ─── ADD CARD ────────────────────────────────────────────────────────────

  function handleAddCardAskDeck(text: string) {
    const cur = stateRef.current;

    // Responding to "do you want to create a new deck?" confirmation
    if (cur.isConfirming) {
      if (isYes(text)) {
        say(`Sobre qual assunto você quer estudar no deck "${cur.pendingDeckName}"?`);
        go('CREATE_DECK__ASK_SUBJECT');
        return;
      } else if (isNo(text)) {
        say('Ok! O que mais posso fazer por você?');
        go('AWAITING_MAIN_OPTION', { pendingDeckName: null });
        return;
      } else {
        say(`Diga "sim" para criar o deck "${cur.pendingDeckName}" ou "não" para cancelar.`);
        patch({ isProcessing: false });
        return;
      }
    }

    const found = findDeck(decksRef.current, text);
    if (found) {
      say(`Sobre qual assunto você gostaria que eu criasse os flashcards para "${found.title}"?`);
      go('ADD_CARD__ASK_SUBJECT', { pendingDeck: found });
    } else {
      say(`Não encontrei o deck "${text}". Deseja criar um novo deck com esse nome?`);
      patch({
        pendingDeckName: text,
        isProcessing: false,
        isConfirming: true,
        options: ['Sim, criar novo deck', 'Não, cancelar'],
      });
    }
  }

  async function handleAddCardAskSubject(text: string) {
    const subject = text.trim();
    const targetDeck = stateRef.current.pendingDeck!;

    patch({ isProcessing: true });
    try {
      // Generate AI flashcards via temp deck
      const tempTitle = `__temp_${uid()}`;
      const { deck: tempDeck, flashcards: aiCards } = await createDeck({
        title: tempTitle,
        description: subject,
        prompt: subject,
        numberOfCards: 10,
      });

      // Add each generated card to the target deck
      for (const card of aiCards) {
        const { flashcard } = await createFlashcard(targetDeck.id, card.question, card.answer);
        storeAddFlashcard(targetDeck.id, flashcard);
      }

      // Clean up temp deck
      try {
        await deleteDeck(tempDeck.id);
      } catch {
        // best-effort cleanup
      }

      say(
        `Adicionei ${aiCards.length} flashcards sobre ${subject} no deck "${targetDeck.title}"! Quer estudar esse deck agora?`
      );
      go('POST_ACTION__ASK_STUDY', { pendingDeck: targetDeck, options: ['Sim', 'Não'] });
    } catch {
      say('Não consegui gerar os flashcards. Tente novamente.');
      go('AWAITING_MAIN_OPTION');
    }
  }

  // ─── DELETE DECK ─────────────────────────────────────────────────────────

  function handleDeleteDeckAskWhich(text: string) {
    const found = findDeck(decksRef.current, text);
    if (found) {
      say(
        `Tem certeza que deseja excluir o deck "${found.title}"? Essa ação não pode ser desfeita.`
      );
      go('DELETE_DECK__CONFIRM', { pendingDeck: found, options: ['Sim, excluir', 'Não, cancelar'] });
    } else {
      say(`Não encontrei o deck "${text}". Qual deck você deseja excluir?`);
      patch({ isProcessing: false });
    }
  }

  async function handleDeleteDeckConfirm(text: string) {
    const cur = stateRef.current;
    const deck = cur.pendingDeck!;

    if (isYes(text)) {
      patch({ isProcessing: true });
      try {
        await deleteDeck(deck.id);
        storeRemoveDeck(deck.id);
        say(`Deck "${deck.title}" excluído com sucesso! O que mais posso fazer por você?`);
        go('AWAITING_MAIN_OPTION', { pendingDeck: null });
      } catch {
        say('Não consegui excluir o deck. Tente novamente.');
        go('AWAITING_MAIN_OPTION');
      }
    } else if (isNo(text)) {
      say('Ok! O deck foi mantido. O que mais posso fazer por você?');
      go('AWAITING_MAIN_OPTION', { pendingDeck: null });
    } else {
      say('Não entendi. Diga "sim" para confirmar ou "não" para cancelar.');
      patch({ isProcessing: false });
    }
  }

  // ─── STUDY ───────────────────────────────────────────────────────────────

  async function startStudyForDeck(deckNameQuery: string) {
    const cur = stateRef.current;

    // Responding to "want me to list your decks?" confirmation
    if (cur.isConfirming) {
      if (isYes(deckNameQuery)) {
        patch({ isProcessing: true });
        try {
          const { decks: loaded } = await getDecks();
          setDecks(loaded);
          const nameList = loaded.map((d) => d.title).join(', ');
          say(`Seus decks são: ${nameList}. Qual você quer estudar?`);
          go('LIST_DECKS');
        } catch {
          say('Não consegui carregar os decks. Tente novamente.');
          go('AWAITING_MAIN_OPTION');
        }
        return;
      } else if (isNo(deckNameQuery)) {
        say('Tudo bem! O que mais posso fazer por você?');
        go('AWAITING_MAIN_OPTION');
        return;
      }
      // Otherwise fall through — treat as a deck name (try again)
    }

    const found = findDeck(decksRef.current, deckNameQuery);
    if (!found) {
      say(`Não encontrei o deck "${deckNameQuery}". Quer que eu liste seus decks?`);
      patch({
        isProcessing: false,
        isConfirming: true,
        options: ['Sim, listar meus decks', 'Não, tentar outro nome'],
      });
      return;
    }

    patch({ isProcessing: true });
    try {
      const { flashcards } = await getFlashcards(found.id);
      storeSetFlashcards(found.id, flashcards);

      if (flashcards.length === 0) {
        say(
          `O deck "${found.title}" ainda não tem flashcards. Diga "adicionar flashcards" para criar alguns.`
        );
        go('AWAITING_MAIN_OPTION', { pendingDeck: found });
        return;
      }

      const { session } = await startStudySession(found.id);

      say(
        `Ótimo! Vamos estudar "${found.title}" com ${flashcards.length} card${flashcards.length > 1 ? 's' : ''}. Aqui vai o primeiro: ${flashcards[0].question}`
      );
      go('STUDY__IN_PROGRESS', {
        pendingDeck: found,
        studyCards: flashcards,
        currentCardIndex: 0,
        studyResults: [],
        studySessionId: session.id,
      });
    } catch {
      say('Não consegui carregar os flashcards. Tente novamente.');
      go('AWAITING_MAIN_OPTION');
    }
  }

  function handleStudyInProgress(text: string) {
    const cur = stateRef.current;
    const card = cur.studyCards[cur.currentCardIndex];
    if (!card) {
      go('AWAITING_MAIN_OPTION');
      return;
    }
    // User gave their answer — now reveal the correct answer and ask for self-evaluation
    say(
      `Resposta correta: ${card.answer}. Você acertou, errou ou ficou com dúvida?`
    );
    go('STUDY__SELF_EVALUATE', { options: ['Acertei', 'Errei', 'Tive dúvida'] });
  }

  async function handleStudySelfEvaluate(text: string) {
    const result = detectStudyResult(text);
    if (!result) {
      say('Não entendi. Diga "acertei", "errei" ou "tive dúvida".');
      patch({ isProcessing: false, options: ['Acertei', 'Errei', 'Tive dúvida'] });
      return;
    }

    const cur = stateRef.current;
    const card = cur.studyCards[cur.currentCardIndex];
    const sessionId = cur.studySessionId;

    const newResults = [...cur.studyResults, { flashcardId: card.id, result }];

    // Update SRS
    try {
      if (sessionId) {
        const { nextSRS } = await answerCard(sessionId, {
          flashcardId: card.id,
          result,
          timeSpentMs: 0,
        });
        updateFlashcardStats(cur.pendingDeck!.id, card.id, result, nextSRS);
      }
    } catch {
      // best-effort
    }

    const nextIndex = cur.currentCardIndex + 1;

    if (nextIndex >= cur.studyCards.length) {
      await finishStudySession(newResults, cur);
    } else {
      const nextCard = cur.studyCards[nextIndex];
      const resultEmoji = result === 'correct' ? '✓' : result === 'wrong' ? '✗' : '~';
      say(
        `${resultEmoji} Card ${nextIndex} de ${cur.studyCards.length}. Próxima pergunta: ${nextCard.question}`
      );
      patch({
        chatState: 'STUDY__IN_PROGRESS',
        currentCardIndex: nextIndex,
        studyResults: newResults,
        isProcessing: false,
        options: null,
        retryCount: 0,
      });
    }
  }

  async function finishStudySession(
    results: Array<{ flashcardId: string; result: StudyResult }>,
    cur: MachineState
  ) {
    const correct = results.filter((r) => r.result === 'correct').length;
    const wrong = results.filter((r) => r.result === 'wrong').length;
    const doubt = results.filter((r) => r.result === 'doubt').length;
    const total = results.length;
    const fallbackSummary = {
      totalCards: total,
      correct,
      wrong,
      doubt,
      totalTimeMs: 0,
      averageTimePerCardMs: 0,
    };

    try {
      if (cur.studySessionId) {
        const res = await completeSession(cur.studySessionId);
        updateDeckProgress(cur.pendingDeck!.id, res.summary);
        recordSession(res.summary);
      } else {
        updateDeckProgress(cur.pendingDeck!.id, fallbackSummary);
        recordSession(fallbackSummary);
      }
    } catch {
      updateDeckProgress(cur.pendingDeck!.id, fallbackSummary);
      recordSession(fallbackSummary);
    }

    const hasFailedCards = wrong + doubt > 0;
    const summaryText = `Parabéns! Você finalizou o deck "${cur.pendingDeck!.title}"! Você acertou ${correct}, errou ${wrong} e ficou com dúvida em ${doubt} card${doubt !== 1 ? 's' : ''}.`;
    const retryText = hasFailedCards ? ' Deseja repetir os cards que errou ou ficaram com dúvida?' : '';

    say(summaryText + retryText);

    if (hasFailedCards) {
      go('STUDY__FINISHED', {
        studyResults: results,
        options: ['Sim, repetir', 'Não, encerrar'],
      });
    } else {
      go('POST_ACTION__ASK_STUDY', { studyResults: results, options: ['Sim', 'Não'] });
    }
  }

  async function handleStudyFinished(text: string) {
    const cur = stateRef.current;

    if (isYes(text)) {
      const failedCards = cur.studyCards.filter((c) =>
        cur.studyResults.some((r) => r.flashcardId === c.id && r.result !== 'correct')
      );

      if (failedCards.length === 0 || !cur.pendingDeck) {
        say('Todos os cards já foram dominados! O que mais posso fazer por você?');
        go('AWAITING_MAIN_OPTION');
        return;
      }

      patch({ isProcessing: true });
      try {
        const { session } = await startStudySession(cur.pendingDeck.id);
        say(
          `Vamos lá! Revisando ${failedCards.length} card${failedCards.length > 1 ? 's' : ''}. Primeira pergunta: ${failedCards[0].question}`
        );
        go('STUDY__IN_PROGRESS', {
          studyCards: failedCards,
          currentCardIndex: 0,
          studyResults: [],
          studySessionId: session.id,
        });
      } catch {
        say('Não consegui iniciar a revisão. Tente novamente.');
        go('AWAITING_MAIN_OPTION');
      }
    } else {
      say('Ótimo trabalho! O que mais posso fazer por você?');
      go('AWAITING_MAIN_OPTION');
    }
  }

  // ─── POST ACTION ─────────────────────────────────────────────────────────

  async function handlePostActionAskStudy(text: string) {
    const cur = stateRef.current;

    if (isYes(text)) {
      if (cur.pendingDeck) {
        await startStudyForDeck(cur.pendingDeck.title);
      } else {
        say('Qual deck você gostaria de estudar?');
        go('STUDY__ASK_DECK');
      }
    } else {
      say('Tudo certo! Estou aqui se precisar de mais alguma coisa.');
      go('AWAITING_MAIN_OPTION');
    }
  }

  // ─── Main input handler ──────────────────────────────────────────────────

  const handleUserInput = useCallback(async (text: string) => {
    if (isProcessingRef.current) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    isProcessingRef.current = true;
    const cur = stateRef.current;

    addMsg('user', trimmed);
    patch({ isProcessing: true, options: null, showTextInput: false, failedVoiceAttempts: 0 });

    try {
      switch (cur.chatState) {
        case 'AWAITING_MAIN_OPTION':
          await handleMainOption(trimmed);
          break;
        case 'CREATE_DECK__ASK_NAME':
          handleCreateDeckAskName(trimmed);
          break;
        case 'CREATE_DECK__ASK_SUBJECT':
          await handleCreateDeckAskSubject(trimmed);
          break;
        case 'ADD_CARD__ASK_DECK':
          handleAddCardAskDeck(trimmed);
          break;
        case 'ADD_CARD__ASK_SUBJECT':
          await handleAddCardAskSubject(trimmed);
          break;
        case 'LIST_DECKS':
          await startStudyForDeck(trimmed);
          break;
        case 'DELETE_DECK__ASK_WHICH':
          handleDeleteDeckAskWhich(trimmed);
          break;
        case 'DELETE_DECK__CONFIRM':
          await handleDeleteDeckConfirm(trimmed);
          break;
        case 'STUDY__ASK_DECK':
          await startStudyForDeck(trimmed);
          break;
        case 'STUDY__IN_PROGRESS':
          handleStudyInProgress(trimmed);
          break;
        case 'STUDY__SELF_EVALUATE':
          await handleStudySelfEvaluate(trimmed);
          break;
        case 'STUDY__FINISHED':
          await handleStudyFinished(trimmed);
          break;
        case 'POST_ACTION__ASK_STUDY':
          await handlePostActionAskStudy(trimmed);
          break;
        default:
          patch({ isProcessing: false });
      }
    } catch {
      say('Ocorreu um erro inesperado. Tente novamente.');
      go('AWAITING_MAIN_OPTION');
    } finally {
      isProcessingRef.current = false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Voice error handler ─────────────────────────────────────────────────

  const handleVoiceError = useCallback((error: string) => {
    const cur = stateRef.current;
    const newAttempts = cur.failedVoiceAttempts + 1;

    if (newAttempts >= 2) {
      say('Não consegui te entender. Pode digitar sua resposta?');
      patch({ failedVoiceAttempts: newAttempts, showTextInput: true });
    } else {
      patch({ failedVoiceAttempts: newAttempts });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTextInput = useCallback(() => {
    patch({ showTextInput: !stateRef.current.showTextInput });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Initialize ──────────────────────────────────────────────────────────

  useEffect(() => {
    const firstName = userName.split(' ')[0] || 'usuário';
    const greeting =
      `Olá, ${firstName}! Vamos estudar? O que você gostaria de fazer? ` +
      `Posso criar um deck, listar seus decks, excluir um deck, adicionar flashcards a um deck, ou estudar um deck.`;

    const timer = setTimeout(() => {
      say(greeting);
      go('AWAITING_MAIN_OPTION');
    }, 400);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, handleUserInput, handleVoiceError, toggleTextInput, isSpeaking, stopTTS };
}
