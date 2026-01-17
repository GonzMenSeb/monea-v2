import { render, screen } from '@testing-library/react-native';

import { LoadingState } from '../../feedback/LoadingState';

describe('LoadingState', () => {
  describe('Rendering', () => {
    it('renders loading indicator', () => {
      render(<LoadingState />);
      const container = screen.getByTestId('activity-indicator');
      expect(container).toBeTruthy();
    });

    it('renders without message by default', () => {
      const { queryByText } = render(<LoadingState />);
      expect(queryByText(/./)).toBeNull();
    });

    it('renders with message', () => {
      render(<LoadingState message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('renders with small size', () => {
      render(<LoadingState size="sm" />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('renders with medium size by default', () => {
      render(<LoadingState />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('renders with large size', () => {
      render(<LoadingState size="lg" />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('shows small message text with sm size', () => {
      render(<LoadingState size="sm" message="Small loading" />);
      expect(screen.getByText('Small loading')).toBeTruthy();
    });

    it('shows medium message text with md size', () => {
      render(<LoadingState size="md" message="Medium loading" />);
      expect(screen.getByText('Medium loading')).toBeTruthy();
    });

    it('shows large message text with lg size', () => {
      render(<LoadingState size="lg" message="Large loading" />);
      expect(screen.getByText('Large loading')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders with default variant', () => {
      render(<LoadingState variant="default" />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('renders with overlay variant', () => {
      render(<LoadingState variant="overlay" />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('renders with inline variant', () => {
      render(<LoadingState variant="inline" />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('renders message with default variant styling', () => {
      render(<LoadingState variant="default" message="Default message" />);
      expect(screen.getByText('Default message')).toBeTruthy();
    });

    it('renders message with inline variant styling', () => {
      render(<LoadingState variant="inline" message="Inline message" />);
      expect(screen.getByText('Inline message')).toBeTruthy();
    });

    it('renders message with overlay variant styling', () => {
      render(<LoadingState variant="overlay" message="Overlay message" />);
      expect(screen.getByText('Overlay message')).toBeTruthy();
    });
  });

  describe('Color', () => {
    it('uses default primary color', () => {
      render(<LoadingState />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });

    it('accepts custom color', () => {
      render(<LoadingState color="#FF0000" />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });
  });

  describe('Combined Props', () => {
    it('renders with size, variant, and message', () => {
      render(<LoadingState size="lg" variant="overlay" message="Loading..." />);
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
      expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('renders with all custom props', () => {
      render(
        <LoadingState size="sm" variant="inline" message="Please wait" color="#0000FF" />
      );
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
      expect(screen.getByText('Please wait')).toBeTruthy();
    });
  });

  describe('Different Messages', () => {
    it('renders short message', () => {
      render(<LoadingState message="Wait" />);
      expect(screen.getByText('Wait')).toBeTruthy();
    });

    it('renders long message', () => {
      render(<LoadingState message="Please wait while we load your data..." />);
      expect(screen.getByText('Please wait while we load your data...')).toBeTruthy();
    });

    it('renders message with special characters', () => {
      render(<LoadingState message="Loading 50%..." />);
      expect(screen.getByText('Loading 50%...')).toBeTruthy();
    });
  });
});
