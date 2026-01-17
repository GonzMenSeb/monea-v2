import {
  classifyError,
  createAppError,
  formatErrorForUser,
  getErrorMessage,
  isNetworkError,
  isRetryableError,
  withRetry,
} from '../errorHandling';

describe('errorHandling utilities', () => {
  describe('getErrorMessage', () => {
    it('returns the string when error is a string', () => {
      expect(getErrorMessage('Simple error')).toBe('Simple error');
    });

    it('returns message property from Error object', () => {
      const error = new Error('Error message');
      expect(getErrorMessage(error)).toBe('Error message');
    });

    it('returns message property from plain object', () => {
      const error = { message: 'Object message' };
      expect(getErrorMessage(error)).toBe('Object message');
    });

    it('returns error property from plain object', () => {
      const error = { error: 'Error property' };
      expect(getErrorMessage(error)).toBe('Error property');
    });

    it('returns default message for unknown error types', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
      expect(getErrorMessage(123)).toBe('An unexpected error occurred');
    });
  });

  describe('classifyError', () => {
    it('returns "unknown" for null or undefined', () => {
      expect(classifyError(null)).toBe('unknown');
      expect(classifyError(undefined)).toBe('unknown');
    });

    it('classifies network errors', () => {
      expect(classifyError(new Error('Network request failed'))).toBe('network');
      expect(classifyError(new Error('Failed to fetch'))).toBe('network');
      expect(classifyError(new Error('timeout'))).toBe('network');
      expect(classifyError(new Error('No internet connection'))).toBe('network');
      expect(classifyError({ message: 'offline' })).toBe('network');
    });

    it('classifies permission errors', () => {
      expect(classifyError(new Error('Permission denied'))).toBe('permission');
      expect(classifyError(new Error('Not authorized'))).toBe('permission');
      expect(classifyError(new Error('Access denied'))).toBe('permission');
    });

    it('classifies validation errors', () => {
      expect(classifyError(new Error('Invalid email format'))).toBe('validation');
      expect(classifyError(new Error('Field is required'))).toBe('validation');
    });

    it('returns "unknown" for unclassifiable errors', () => {
      expect(classifyError(new Error('Some random error'))).toBe('unknown');
    });
  });

  describe('createAppError', () => {
    it('creates AppError with correct type', () => {
      const error = new Error('Network request failed');
      const appError = createAppError(error);

      expect(appError.type).toBe('network');
      expect(appError.message).toBe('Network request failed');
      expect(appError.originalError).toBe(error);
      expect(appError.isRetryable).toBe(true);
    });

    it('extracts error code when present', () => {
      const error = new Error('Error with code') as Error & { code: string };
      error.code = 'ERR_001';
      const appError = createAppError(error);

      expect(appError.code).toBe('ERR_001');
    });

    it('sets isRetryable true for network and server errors', () => {
      expect(createAppError(new Error('Network error')).isRetryable).toBe(true);
    });

    it('sets isRetryable false for permission errors', () => {
      expect(createAppError(new Error('Permission denied')).isRetryable).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('returns true for network-related errors', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('offline'))).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError(new Error('Permission denied'))).toBe(false);
      expect(isNetworkError(new Error('Invalid input'))).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('returns true for network errors', () => {
      expect(isRetryableError(new Error('Network error'))).toBe(true);
    });

    it('returns false for permission errors', () => {
      expect(isRetryableError(new Error('Permission denied'))).toBe(false);
    });

    it('returns false for validation errors', () => {
      expect(isRetryableError(new Error('Invalid format'))).toBe(false);
    });
  });

  describe('formatErrorForUser', () => {
    it('formats network errors with connection message', () => {
      const message = formatErrorForUser(new Error('Network request failed'));
      expect(message).toBe('Please check your internet connection and try again.');
    });

    it('formats permission errors with permission message', () => {
      const message = formatErrorForUser(new Error('Permission denied'));
      expect(message).toBe('This action requires additional permissions.');
    });

    it('formats validation errors with original message', () => {
      const message = formatErrorForUser(new Error('Invalid email format'));
      expect(message).toBe('Invalid email format');
    });

    it('formats unknown errors with generic message', () => {
      const message = formatErrorForUser(new Error('Random error'));
      expect(message).toBe('Something went wrong. Please try again.');
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns result on successful execution', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const resultPromise = withRetry(fn);
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable error', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { maxAttempts: 3, delayMs: 100 });

      await jest.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry on non-retryable error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const resultPromise = withRetry(fn, { maxAttempts: 3 });

      await expect(resultPromise).rejects.toThrow('Permission denied');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws after max attempts', async () => {
      jest.useRealTimers();
      const fn = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(withRetry(fn, { maxAttempts: 2, delayMs: 10 })).rejects.toThrow('Network error');

      expect(fn).toHaveBeenCalledTimes(2);
      jest.useFakeTimers();
    });

    it('calls onRetry callback on each retry', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const resultPromise = withRetry(fn, { maxAttempts: 3, delayMs: 100, onRetry });

      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(200);
      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2);
    });
  });
});
