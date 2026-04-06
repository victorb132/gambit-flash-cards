/** Simulate realistic API delay */
export function simulateDelay(min = 300, max = 800): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simulate AI generation delay (3–5 seconds) */
export function simulateAIDelay(): Promise<void> {
  return simulateDelay(3000, 5000);
}
