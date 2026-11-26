/** Bounded retry with explicit backoff for read-after-write RPC calls. */

export interface RetryOptions {
  attempts?: number;
  delaysMs?: readonly number[];
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, delaysMs = [300, 700] }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (cause) {
      lastError = cause;
      if (attempt < attempts - 1) {
        const delay = delaysMs[Math.min(attempt, delaysMs.length - 1)] ?? 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
