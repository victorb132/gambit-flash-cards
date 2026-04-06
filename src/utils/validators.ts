/** Input validation utilities */

/** Validate email format */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/** Validate password minimum length */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/** Validate deck title */
export function isValidDeckTitle(title: string): boolean {
  return title.trim().length > 0 && title.trim().length <= 60;
}

/** Validate AI generation prompt */
export function isValidPrompt(prompt: string): boolean {
  return prompt.trim().length >= 20;
}

/** Validate number of cards in range */
export function isValidCardCount(count: number): boolean {
  return count >= 5 && count <= 30;
}
