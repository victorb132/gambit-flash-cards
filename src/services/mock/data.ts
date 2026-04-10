import { Deck } from '../../types/deck';
import { FlashCard } from '../../types/flashcard';

/** Pre-seeded deck data */
export const SEED_DECKS: Deck[] = [
  {
    id: 'deck-1',
    title: 'Fundamentos de JavaScript',
    description: 'Conceitos fundamentais do JavaScript moderno',
    coverEmoji: '💻',
    cardCount: 5,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastStudiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    progress: {
      totalCards: 5,
      mastered: 3,
      learning: 1,
      notStarted: 1,
      completionPercentage: 60,
      dueCount: 2,
    },
  },
  {
    id: 'deck-2',
    title: 'Capitais do Mundo',
    description: 'Capitais dos países ao redor do mundo',
    coverEmoji: '🌍',
    cardCount: 5,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    lastStudiedAt: undefined,
    progress: {
      totalCards: 5,
      mastered: 0,
      learning: 0,
      notStarted: 5,
      completionPercentage: 0,
      dueCount: 5,
    },
  },
  {
    id: 'deck-3',
    title: 'Biologia Celular',
    description: 'Estrutura e função das células',
    coverEmoji: '🧬',
    cardCount: 5,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastStudiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    progress: {
      totalCards: 5,
      mastered: 2,
      learning: 3,
      notStarted: 0,
      completionPercentage: 40,
      dueCount: 3,
    },
  },
];

/** Pre-seeded flashcard data keyed by deckId */
export const SEED_FLASHCARDS: Record<string, FlashCard[]> = {
  'deck-1': [
    {
      id: 'fc-1-1',
      deckId: 'deck-1',
      question: 'O que é um closure em JavaScript?',
      answer:
        'Um closure é uma função que tem acesso às variáveis do seu escopo externo, mesmo após a função externa ter retornado. Ele "fecha" sobre as variáveis do ambiente onde foi criado.',
      order: 1,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 3,
        timesCorrect: 3,
        timesWrong: 0,
        timesDoubt: 0,
        lastResult: 'correct',
        lastStudiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'fc-1-2',
      deckId: 'deck-1',
      question: 'O que é hoisting em JavaScript?',
      answer:
        'Hoisting é o comportamento do JavaScript de mover declarações de variáveis (var) e funções para o topo do seu escopo antes da execução. Variáveis declaradas com let e const são hoisted mas não inicializadas.',
      order: 2,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 2,
        timesCorrect: 2,
        timesWrong: 0,
        timesDoubt: 0,
        lastResult: 'correct',
        lastStudiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'fc-1-3',
      deckId: 'deck-1',
      question: 'Como funciona o Event Loop no JavaScript?',
      answer:
        'O Event Loop monitora a Call Stack e a Callback Queue. Quando a Call Stack está vazia, ele move callbacks da queue para a stack. Isso permite que o JavaScript execute código assíncrono de forma single-threaded.',
      order: 3,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 1,
        timesCorrect: 1,
        timesWrong: 0,
        timesDoubt: 0,
        lastResult: 'correct',
        lastStudiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'fc-1-4',
      deckId: 'deck-1',
      question: 'Qual a diferença entre Promise e async/await?',
      answer:
        'async/await é açúcar sintático sobre Promises. async declara uma função assíncrona que retorna uma Promise, e await pausa a execução até a Promise resolver. Ambos lidam com operações assíncronas, mas async/await tem sintaxe mais legível.',
      order: 4,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 1,
        timesCorrect: 0,
        timesWrong: 1,
        timesDoubt: 0,
        lastResult: 'wrong',
        lastStudiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'fc-1-5',
      deckId: 'deck-1',
      question: 'O que é prototype chain em JavaScript?',
      answer:
        'A prototype chain é o mecanismo de herança do JavaScript. Cada objeto tem uma propriedade __proto__ que aponta para seu protótipo. Quando se acessa uma propriedade, o JS busca no objeto e depois na cadeia de protótipos até chegar em null.',
      order: 5,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 0,
        timesCorrect: 0,
        timesWrong: 0,
        timesDoubt: 0,
        lastResult: undefined,
        lastStudiedAt: undefined,
      },
    },
  ],
  'deck-2': [
    {
      id: 'fc-2-1',
      deckId: 'deck-2',
      question: 'Qual é a capital da Austrália?',
      answer:
        'Camberra (Canberra). Muita gente pensa que é Sydney ou Melbourne, mas a capital foi planejada e construída especialmente para ser a sede do governo australiano.',
      order: 1,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
    },
    {
      id: 'fc-2-2',
      deckId: 'deck-2',
      question: 'Qual é a capital do Canadá?',
      answer:
        'Ottawa. Embora Toronto seja a maior cidade do Canadá, a capital federal é Ottawa, localizada na província de Ontário.',
      order: 2,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
    },
    {
      id: 'fc-2-3',
      deckId: 'deck-2',
      question: 'Qual é a capital do Brasil?',
      answer:
        'Brasília. Inaugurada em 1960, Brasília foi construída para ser a nova capital federal, substituindo o Rio de Janeiro. É tombada como Patrimônio da Humanidade pela UNESCO.',
      order: 3,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
    },
    {
      id: 'fc-2-4',
      deckId: 'deck-2',
      question: 'Qual é a capital da Nova Zelândia?',
      answer:
        'Wellington. Apesar de Auckland ser a maior cidade, Wellington é a capital e sede do governo neozelandês, localizada na Ilha Norte.',
      order: 4,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
    },
    {
      id: 'fc-2-5',
      deckId: 'deck-2',
      question: 'Qual é a capital da Índia?',
      answer:
        'Nova Delhi (New Delhi). É a capital federal da Índia e parte da área metropolitana de Delhi, uma das maiores regiões urbanas do mundo.',
      order: 5,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 },
    },
  ],
  'deck-3': [
    {
      id: 'fc-3-1',
      deckId: 'deck-3',
      question: 'Qual é a função da mitocôndria na célula?',
      answer:
        'A mitocôndria é a "usina de energia" da célula. Ela produz ATP (adenosina trifosfato) através da respiração celular, processo que converte glicose e oxigênio em energia utilizável pela célula.',
      order: 1,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 2,
        timesCorrect: 2,
        timesWrong: 0,
        timesDoubt: 0,
        lastResult: 'correct',
        lastStudiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'fc-3-2',
      deckId: 'deck-3',
      question: 'Qual a diferença entre DNA e RNA?',
      answer:
        'DNA (ácido desoxirribonucleico) é de fita dupla, contém a base timina e é encontrado no núcleo. RNA (ácido ribonucleico) é de fita simples, contém uracila em vez de timina e participa da síntese proteica.',
      order: 2,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 1,
        timesCorrect: 1,
        timesWrong: 0,
        timesDoubt: 0,
        lastResult: 'correct',
        lastStudiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'fc-3-3',
      deckId: 'deck-3',
      question: 'Qual a diferença entre célula animal e vegetal?',
      answer:
        'Células vegetais possuem parede celular, cloroplastos e vacúolo central grande. Células animais não têm parede celular, possuem centríolos e lisossomos mais desenvolvidos. Ambas têm núcleo, mitocôndrias e ribossomos.',
      order: 3,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 1,
        timesCorrect: 0,
        timesWrong: 0,
        timesDoubt: 1,
        lastResult: 'doubt',
        lastStudiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'fc-3-4',
      deckId: 'deck-3',
      question: 'O que é fotossíntese e onde ocorre?',
      answer:
        'Fotossíntese é o processo pelo qual plantas, algas e cianobactérias convertem luz solar, água e CO₂ em glicose e oxigênio. Ocorre nos cloroplastos, organelas que contêm clorofila, o pigmento que captura a energia luminosa.',
      order: 4,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 1,
        timesCorrect: 0,
        timesWrong: 0,
        timesDoubt: 1,
        lastResult: 'doubt',
        lastStudiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      id: 'fc-3-5',
      deckId: 'deck-3',
      question: 'O que são ribossomos e qual sua função?',
      answer:
        'Ribossomos são organelas responsáveis pela síntese de proteínas. Eles leem o mRNA (RNA mensageiro) e montam cadeias de aminoácidos conforme as instruções genéticas. Podem estar livres no citoplasma ou ligados ao retículo endoplasmático rugoso.',
      order: 5,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        timesStudied: 1,
        timesCorrect: 0,
        timesWrong: 1,
        timesDoubt: 0,
        lastResult: 'wrong',
        lastStudiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  ],
};

/** Template flashcard sets for new deck generation, keyed by topic */
export const FLASHCARD_TEMPLATES: Record<string, Array<{ question: string; answer: string }>> = {
  programming: [
    {
      question: 'O que é orientação a objetos (OOP)?',
      answer:
        'Paradigma de programação baseado em objetos que encapsulam dados (atributos) e comportamentos (métodos). Seus pilares são: Encapsulamento, Herança, Polimorfismo e Abstração.',
    },
    {
      question: 'O que é uma API REST?',
      answer:
        'REST (Representational State Transfer) é um estilo arquitetural para sistemas distribuídos. Uma API REST usa HTTP e opera sobre recursos identificados por URLs, usando métodos como GET, POST, PUT e DELETE.',
    },
    {
      question: 'O que é recursão em programação?',
      answer:
        'Recursão é quando uma função chama a si mesma para resolver um problema. Toda função recursiva precisa de um caso base (condição de parada) para evitar loop infinito.',
    },
    {
      question: 'O que é um banco de dados relacional?',
      answer:
        'Um banco de dados que organiza dados em tabelas com linhas e colunas, onde os relacionamentos entre tabelas são definidos por chaves primárias e estrangeiras. Exemplos: PostgreSQL, MySQL, SQLite.',
    },
    {
      question: 'O que é controle de versão com Git?',
      answer:
        'Git é um sistema de controle de versão distribuído que rastreia mudanças no código ao longo do tempo. Permite colaboração, branches para desenvolvimento paralelo e histórico completo de alterações.',
    },
  ],
  history: [
    {
      question: 'Quando ocorreu a Segunda Guerra Mundial?',
      answer:
        'A Segunda Guerra Mundial durou de 1939 a 1945. Começou com a invasão da Polônia pela Alemanha nazista em 1 de setembro de 1939 e terminou com a rendição do Japão em 2 de setembro de 1945.',
    },
    {
      question: 'O que foi a Revolução Francesa?',
      answer:
        'Movimento político e social ocorrido entre 1789 e 1799 na França, que derrubou a monarquia absolutista e estabeleceu os ideais de Liberdade, Igualdade e Fraternidade. Originou a Declaração dos Direitos do Homem.',
    },
    {
      question: 'Quem foi Napoleão Bonaparte?',
      answer:
        'Líder militar e político francês (1769-1821) que se tornou Imperador da França. Expandiu o domínio francês pela Europa, codificou leis no Código Napoleônico e foi exilado após a derrota em Waterloo em 1815.',
    },
    {
      question: 'O que foi a Guerra Fria?',
      answer:
        'Tensão geopolítica entre EUA e URSS após a Segunda Guerra Mundial (1947-1991). Caracterizada por corrida armamentista, corrida espacial e conflitos por procuração, mas sem confronto militar direto entre as superpotências.',
    },
    {
      question: 'O que foi a Revolução Industrial?',
      answer:
        'Transformação econômica e social iniciada na Inglaterra no século XVIII, com a mecanização da produção, surgimento das fábricas, uso do vapor como energia e migração campo-cidade. Mudou radicalmente o modo de trabalho e vida.',
    },
  ],
  science: [
    {
      question: 'O que é a Teoria da Relatividade de Einstein?',
      answer:
        'Composta por duas teorias: a Restrita (1905) que estabelece que a velocidade da luz é constante e E=mc², e a Geral (1915) que descreve a gravidade como curvatura do espaço-tempo causada por massa.',
    },
    {
      question: 'O que é a tabela periódica?',
      answer:
        'Organização dos elementos químicos por número atômico crescente, agrupados por propriedades similares. Criada por Mendeleev em 1869, hoje contém 118 elementos confirmados, dispostos em 7 períodos e 18 grupos.',
    },
    {
      question: 'O que é evolução por seleção natural?',
      answer:
        'Teoria de Charles Darwin que explica como espécies mudam ao longo do tempo. Indivíduos com características mais adaptadas ao ambiente têm maior chance de sobreviver e reproduzir, passando essas características adiante.',
    },
    {
      question: 'O que é o Big Bang?',
      answer:
        'Teoria cosmológica que descreve a origem do universo há aproximadamente 13,8 bilhões de anos a partir de uma singularidade extremamente quente e densa. Apoiada pela expansão do universo e pela radiação cósmica de fundo.',
    },
    {
      question: 'O que são ondas eletromagnéticas?',
      answer:
        'Perturbações nos campos elétrico e magnético que se propagam pelo espaço a 300.000 km/s. O espectro inclui (do menor ao maior comprimento de onda): raios gama, raios-X, ultravioleta, visível, infravermelho, micro-ondas e ondas de rádio.',
    },
  ],
  languages: [
    {
      question: 'Quais são os tempos verbais mais comuns em inglês?',
      answer:
        'Simple Present (hábitos), Simple Past (fatos passados), Present Continuous (ações em progresso), Present Perfect (ações com relevância presente), Future com "will" (decisões espontâneas) e "going to" (planos).',
    },
    {
      question: 'O que são "false friends" em idiomas estrangeiros?',
      answer:
        'Palavras semelhantes em dois idiomas mas com significados diferentes. Ex: "pretend" em inglês significa "fingir" (não "pretender"), "actually" significa "na verdade" (não "atualmente"), "push" significa "empurrar" (não "puxar").',
    },
    {
      question: 'Quais são os artigos em alemão?',
      answer:
        'Em alemão há três gêneros: masculino (der), feminino (die) e neutro (das) no nominativo. No acusativo: den (masc.), die (fem.), das (neut.). Os artigos mudam conforme o caso gramatical (nominativo, acusativo, dativo, genitivo).',
    },
    {
      question: 'O que é o subjuntivo em espanhol?',
      answer:
        'Modo verbal usado para expressar desejos, emoções, dúvidas, suposições e situações hipotéticas. Ex: "Espero que vengas" (Espero que você venha). É muito mais usado em espanhol do que o subjuntivo em português.',
    },
    {
      question: 'Quais são os números de 1 a 10 em japonês?',
      answer:
        'Ichi (1), ni (2), san (3), shi/yon (4), go (5), roku (6), shichi/nana (7), hachi (8), ku/kyuu (9), juu (10). O japonês tem dois sistemas de leitura para números: sino-japonês e japonês nativo.',
    },
  ],
};

/** Match a prompt to the best template topic using keyword detection */
export function matchPromptToTemplate(prompt: string): string {
  const lower = prompt.toLowerCase();

  const keywords: Record<string, string[]> = {
    programming: [
      'programação',
      'javascript',
      'python',
      'código',
      'software',
      'react',
      'banco de dados',
      'api',
      'git',
      'algoritmo',
      'dev',
      'desenvolvimento',
    ],
    history: [
      'história',
      'guerra',
      'revolução',
      'histórico',
      'século',
      'império',
      'medieval',
      'antigo',
      'moderno',
    ],
    science: [
      'ciência',
      'física',
      'química',
      'biologia',
      'astronomia',
      'evolução',
      'átomo',
      'célula',
      'universo',
      'natureza',
    ],
    languages: [
      'idioma',
      'inglês',
      'espanhol',
      'francês',
      'alemão',
      'japonês',
      'língua',
      'gramática',
      'vocabulário',
      'verbo',
    ],
  };

  for (const [topic, words] of Object.entries(keywords)) {
    if (words.some((word) => lower.includes(word))) {
      return topic;
    }
  }

  return 'science'; // default fallback
}
