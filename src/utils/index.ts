/**
 * Extract a human-readable message from an Axios error response.
 * Backend error shape (HttpExceptionFilter): { success: false, error: { code, message }, meta }
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (
      error as { response?: { data?: { error?: { message?: string }; message?: string } } }
    ).response?.data;
    if (data?.error?.message) return data.error.message;
    if (data?.message) return data.message;
  }
  return fallback;
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    amount,
  );
}

/**
 * Truncate string with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Sleep for ms milliseconds — use sparingly
 */
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
