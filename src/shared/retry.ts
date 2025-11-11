export interface RetryOptions {
  maxAttempts: number;
  backoff: 'exponential' | 'linear' | 'fixed';
  initialDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelayMs: 1000,
  maxDelayMs: 30000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        throw lastError;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, opts);

      // Call onRetry callback
      if (opts.onRetry) {
        opts.onRetry(attempt, lastError);
      }

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError;
}

function calculateDelay(
  attempt: number,
  opts: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>>
): number {
  let delay: number;

  switch (opts.backoff) {
    case 'exponential':
      delay = opts.initialDelayMs * Math.pow(2, attempt - 1);
      break;
    case 'linear':
      delay = opts.initialDelayMs * attempt;
      break;
    case 'fixed':
      delay = opts.initialDelayMs;
      break;
  }

  return Math.min(delay, opts.maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RetryableOperation<T> {
  private options: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>>;

  constructor(
    private operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  async execute(): Promise<T> {
    return withRetry(this.operation, this.options);
  }

  withMaxAttempts(attempts: number): this {
    this.options.maxAttempts = attempts;
    return this;
  }

  withBackoff(backoff: 'exponential' | 'linear' | 'fixed'): this {
    this.options.backoff = backoff;
    return this;
  }

  withDelay(initialMs: number, maxMs?: number): this {
    this.options.initialDelayMs = initialMs;
    if (maxMs) {
      this.options.maxDelayMs = maxMs;
    }
    return this;
  }
}

