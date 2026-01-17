import { Text, View } from 'react-native';

import { render, screen, fireEvent } from '@testing-library/react-native';

import { ErrorBoundary } from '../ErrorBoundary';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>Child content</Text>;
};

const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <Text>Normal content</Text>
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeTruthy();
    });

    it('renders fallback UI when error is thrown', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeTruthy();
    });

    it('renders custom fallback when provided', () => {
      const customFallback = (
        <View>
          <Text>Custom Error</Text>
        </View>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowingComponent shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error')).toBeTruthy();
      expect(screen.queryByText('Something went wrong')).toBeNull();
    });
  });

  describe('error callbacks', () => {
    it('calls onError callback when error is thrown', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent shouldThrow />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
    });

    it('calls onReset callback when retry button is pressed', () => {
      const onReset = jest.fn();

      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowingComponent shouldThrow />
        </ErrorBoundary>
      );

      fireEvent.press(screen.getByText('Try Again'));

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('error recovery', () => {
    it('calls handleReset when retry button is pressed', () => {
      const onReset = jest.fn();

      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowingComponent shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeTruthy();

      fireEvent.press(screen.getByText('Try Again'));

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('default fallback UI', () => {
    it('displays error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeTruthy();
    });

    it('displays helpful error message', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An unexpected error occurred. Please try again/i)).toBeTruthy();
    });

    it('displays retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeTruthy();
    });
  });
});
