/** Formatting utilities */

/** Format a date string as relative time in pt-BR */
export function formatRelativeDate(dateString?: string): string {
  if (!dateString) return 'Nunca estudado';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `Há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Há 1 dia';
  if (diffDays < 30) return `Há ${diffDays} dias`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Há ${months} ${months > 1 ? 'meses' : 'mês'}`;
  }
  const years = Math.floor(diffDays / 365);
  return `Há ${years} ano${years > 1 ? 's' : ''}`;
}

/** Format milliseconds to a human-readable duration */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

/** Truncate a string to a max length with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/** Capitalize the first letter of a string */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
