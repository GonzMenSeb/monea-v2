import { render, screen, fireEvent } from '@testing-library/react-native';

import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  describe('rendering', () => {
    it('renders default variant with default content', () => {
      render(<ErrorState />);

      expect(screen.getByText('Something went wrong')).toBeTruthy();
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy();
    });

    it('renders network variant with network content', () => {
      render(<ErrorState variant="network" />);

      expect(screen.getByText('No internet connection')).toBeTruthy();
      expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
    });

    it('renders permission variant with permission content', () => {
      render(<ErrorState variant="permission" />);

      expect(screen.getByText('Permission required')).toBeTruthy();
    });

    it('renders server variant with server content', () => {
      render(<ErrorState variant="server" />);

      expect(screen.getByText('Server error')).toBeTruthy();
      expect(
        screen.getByText('Our servers are having trouble. Please try again later.')
      ).toBeTruthy();
    });

    it('renders empty variant with empty content', () => {
      render(<ErrorState variant="empty" />);

      expect(screen.getByText('No data available')).toBeTruthy();
    });
  });

  describe('custom content', () => {
    it('renders custom title', () => {
      render(<ErrorState title="Custom Error Title" />);

      expect(screen.getByText('Custom Error Title')).toBeTruthy();
      expect(screen.queryByText('Something went wrong')).toBeNull();
    });

    it('renders custom message', () => {
      render(<ErrorState message="Custom error message" />);

      expect(screen.getByText('Custom error message')).toBeTruthy();
    });

    it('renders custom retry label', () => {
      render(<ErrorState retryLabel="Retry Now" onRetry={jest.fn()} />);

      expect(screen.getByText('Retry Now')).toBeTruthy();
      expect(screen.queryByText('Try Again')).toBeNull();
    });
  });

  describe('retry action', () => {
    it('renders retry button when onRetry is provided', () => {
      render(<ErrorState onRetry={jest.fn()} />);

      expect(screen.getByText('Try Again')).toBeTruthy();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorState />);

      expect(screen.queryByText('Try Again')).toBeNull();
    });

    it('calls onRetry when retry button is pressed', () => {
      const onRetry = jest.fn();
      render(<ErrorState onRetry={onRetry} />);

      fireEvent.press(screen.getByText('Try Again'));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('secondary action', () => {
    it('renders secondary action button when both label and callback are provided', () => {
      render(<ErrorState secondaryActionLabel="Go Home" onSecondaryAction={jest.fn()} />);

      expect(screen.getByText('Go Home')).toBeTruthy();
    });

    it('does not render secondary action when label is missing', () => {
      render(<ErrorState onSecondaryAction={jest.fn()} />);

      expect(screen.queryByText('Go Home')).toBeNull();
    });

    it('calls onSecondaryAction when secondary button is pressed', () => {
      const onSecondaryAction = jest.fn();
      render(<ErrorState secondaryActionLabel="Go Home" onSecondaryAction={onSecondaryAction} />);

      fireEvent.press(screen.getByText('Go Home'));

      expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple actions', () => {
    it('renders both retry and secondary actions', () => {
      render(
        <ErrorState
          onRetry={jest.fn()}
          secondaryActionLabel="Cancel"
          onSecondaryAction={jest.fn()}
        />
      );

      expect(screen.getByText('Try Again')).toBeTruthy();
      expect(screen.getByText('Cancel')).toBeTruthy();
    });
  });
});
