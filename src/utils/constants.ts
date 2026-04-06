/** App-wide constants */
export const USE_MOCK = true;

export const API_BASE_URL = 'https://api.gambit-flashcards.com';

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@gambit:auth_token',
  REFRESH_TOKEN: '@gambit:refresh_token',
  USER: '@gambit:user',
  MOCK_DECKS: '@gambit:mock_decks',
  MOCK_FLASHCARDS: '@gambit:mock_flashcards',
  MOCK_SESSIONS: '@gambit:mock_sessions',
} as const;

export const MOCK_CREDENTIALS = {
  EMAIL: 'usuario@gambit.com',
  PASSWORD: '123456',
} as const;

export const STUDY_RESULTS = {
  CORRECT: 'correct',
  WRONG: 'wrong',
  DOUBT: 'doubt',
} as const;

export const VOICE_COMMANDS = {
  FLIP: ['mostrar resposta', 'virar', 'resposta', 'mostrar', 'ver resposta'],
  CORRECT: ['acertei', 'correto', 'certo', 'sei', 'sabia'],
  WRONG: ['errei', 'errado', 'não sei', 'não sabia', 'incorreto'],
  DOUBT: ['dúvida', 'mais ou menos', 'talvez', 'não tenho certeza'],
} as const;
