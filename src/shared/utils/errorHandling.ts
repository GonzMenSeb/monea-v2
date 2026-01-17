export type ErrorType = 'network' | 'permission' | 'validation' | 'server' | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  code?: string;
  isRetryable: boolean;
}

const NETWORK_ERROR_PATTERNS = [
  'network request failed',
  'network error',
  'failed to fetch',
  'timeout',
  'no internet',
  'offline',
];

const PERMISSION_ERROR_PATTERNS = ['permission denied', 'not authorized', 'access denied'];

const SERVER_ERROR_CODES = [500, 502, 503, 504];

export function classifyError(error: unknown): ErrorType {
  if (!error) {
    return 'unknown';
  }

  const message = getErrorMessage(error).toLowerCase();

  if (NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern))) {
    return 'network';
  }

  if (PERMISSION_ERROR_PATTERNS.some((pattern) => message.includes(pattern))) {
    return 'permission';
  }

  if (error instanceof Error && 'status' in error) {
    const status = (error as { status: number }).status;
    if (SERVER_ERROR_CODES.includes(status)) {
      return 'server';
    }
  }

  if (message.includes('invalid') || message.includes('required') || message.includes('format')) {
    return 'validation';
  }

  return 'unknown';
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error !== null && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }

  return 'An unexpected error occurred';
}

export function createAppError(error: unknown): AppError {
  const type = classifyError(error);
  const message = getErrorMessage(error);
  const isRetryable = type === 'network' || type === 'server';

  let code: string | undefined;
  if (error instanceof Error && 'code' in error) {
    code = String((error as { code: unknown }).code);
  }

  return {
    type,
    message,
    originalError: error,
    code,
    isRetryable,
  };
}

export function isNetworkError(error: unknown): boolean {
  return classifyError(error) === 'network';
}

export function isRetryableError(error: unknown): boolean {
  const type = classifyError(error);
  return type === 'network' || type === 'server';
}

export function formatErrorForUser(error: unknown): string {
  const type = classifyError(error);

  switch (type) {
    case 'network':
      return 'Please check your internet connection and try again.';
    case 'permission':
      return 'This action requires additional permissions.';
    case 'server':
      return 'Our servers are experiencing issues. Please try again later.';
    case 'validation':
      return getErrorMessage(error);
    default:
      return 'Something went wrong. Please try again.';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number; onRetry?: (attempt: number) => void } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts && isRetryableError(error)) {
        onRetry?.(attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

export function logError(error: unknown, context?: string): void {
  if (__DEV__) {
    const appError = createAppError(error);
    console.error(`[${context ?? 'Error'}]`, {
      type: appError.type,
      message: appError.message,
      code: appError.code,
      originalError: appError.originalError,
    });
  }
}
