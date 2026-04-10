/**
 * SM-2 Spaced Repetition Algorithm
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface SRSData {
  interval: number;     // days until next review
  easeFactor: number;   // multiplier (min 1.3, default 2.5)
  repetitions: number;  // consecutive correct answers
  dueDate: string;      // ISO date string (midnight)
}

export function getInitialSRS(): SRSData {
  const due = new Date();
  due.setHours(0, 0, 0, 0);
  return {
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    dueDate: due.toISOString(),
  };
}

export function calculateNextSRS(
  current: SRSData,
  result: 'correct' | 'wrong' | 'doubt'
): SRSData {
  let { interval, easeFactor, repetitions } = current;

  if (result === 'correct') {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1);
  } else if (result === 'doubt') {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else {
    // wrong
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  const due = new Date();
  due.setDate(due.getDate() + interval);
  due.setHours(0, 0, 0, 0);

  return { interval, easeFactor, repetitions, dueDate: due.toISOString() };
}

/** Returns true if the card is due for review today or is new (no SRS) */
export function isDue(srs?: SRSData): boolean {
  if (!srs) return true;
  const due = new Date(srs.dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due <= now;
}

export function getDueCount(flashcards: { srs?: SRSData }[]): number {
  return flashcards.filter((c) => isDue(c.srs)).length;
}
