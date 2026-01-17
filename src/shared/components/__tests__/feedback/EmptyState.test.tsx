import { View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState } from '../../feedback/EmptyState';

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('renders with title', () => {
      render(<EmptyState title="No data" />);
      expect(screen.getByText('No data')).toBeTruthy();
    });

    it('renders with description', () => {
      render(<EmptyState title="Empty" description="Add items to get started" />);
      expect(screen.getByText('Add items to get started')).toBeTruthy();
    });

    it('renders with custom icon', () => {
      const icon = <View testID="custom-icon" />;
      render(<EmptyState title="Empty" icon={icon} />);
      expect(screen.getByTestId('custom-icon')).toBeTruthy();
    });

    it('renders without icon by default', () => {
      const { queryByTestId } = render(<EmptyState title="Empty" />);
      expect(queryByTestId('empty-icon')).toBeNull();
    });

    it('does not render description when not provided', () => {
      const { queryByText } = render(<EmptyState title="Just Title" />);
      expect(screen.getByText('Just Title')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('uses default variant', () => {
      render(<EmptyState title="Default" variant="default" />);
      expect(screen.getByText('Default')).toBeTruthy();
    });

    it('uses transactions variant with default title', () => {
      render(<EmptyState title="No transactions found" variant="transactions" />);
      expect(screen.getByText('No transactions found')).toBeTruthy();
    });

    it('uses accounts variant with default description', () => {
      render(<EmptyState title="No accounts linked" variant="accounts" />);
      expect(screen.getByText('No accounts linked')).toBeTruthy();
    });

    it('uses search variant', () => {
      render(<EmptyState title="No results found" variant="search" />);
      expect(screen.getByText('No results found')).toBeTruthy();
    });

    it('custom title overrides variant default', () => {
      render(<EmptyState title="Custom title" variant="transactions" />);
      expect(screen.getByText('Custom title')).toBeTruthy();
      expect(screen.queryByText('No transactions found')).toBeNull();
    });

    it('custom description overrides variant default', () => {
      render(<EmptyState title="Empty" description="Custom description" variant="transactions" />);
      expect(screen.getByText('Custom description')).toBeTruthy();
    });
  });

  describe('Action Button', () => {
    it('renders action button when actionLabel is provided', () => {
      render(<EmptyState title="Empty" actionLabel="Add Item" onAction={() => {}} />);
      expect(screen.getByText('Add Item')).toBeTruthy();
    });

    it('does not render action button when actionLabel is missing', () => {
      const { queryByRole } = render(<EmptyState title="Empty" onAction={() => {}} />);
      expect(queryByRole('button')).toBeNull();
    });

    it('does not render action button when onAction is missing', () => {
      const { queryByRole } = render(<EmptyState title="Empty" actionLabel="Add Item" />);
      expect(queryByRole('button')).toBeNull();
    });

    it('calls onAction when button is pressed', () => {
      const onAction = jest.fn();
      render(<EmptyState title="Empty" actionLabel="Add Item" onAction={onAction} />);
      fireEvent.press(screen.getByText('Add Item'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Scenarios', () => {
    it('renders transactions empty state', () => {
      render(
        <EmptyState
          variant="transactions"
          title="No transactions found"
          description="Your transactions will appear here once Monea reads your bank SMS messages."
        />
      );
      expect(screen.getByText('No transactions found')).toBeTruthy();
      expect(
        screen.getByText(
          'Your transactions will appear here once Monea reads your bank SMS messages.'
        )
      ).toBeTruthy();
    });

    it('renders accounts empty state with action', () => {
      const onAction = jest.fn();
      render(
        <EmptyState
          variant="accounts"
          title="No accounts linked"
          description="Link your bank accounts to start tracking your transactions."
          actionLabel="Link Account"
          onAction={onAction}
        />
      );
      expect(screen.getByText('No accounts linked')).toBeTruthy();
      expect(
        screen.getByText('Link your bank accounts to start tracking your transactions.')
      ).toBeTruthy();
      expect(screen.getByText('Link Account')).toBeTruthy();
    });

    it('renders search empty state', () => {
      render(
        <EmptyState
          variant="search"
          title="No results found"
          description="Try adjusting your search or filters."
        />
      );
      expect(screen.getByText('No results found')).toBeTruthy();
      expect(screen.getByText('Try adjusting your search or filters.')).toBeTruthy();
    });

    it('renders with icon, title, description, and action', () => {
      const icon = <View testID="complete-icon" />;
      const onAction = jest.fn();
      render(
        <EmptyState
          title="Complete Example"
          description="This has everything"
          icon={icon}
          actionLabel="Take Action"
          onAction={onAction}
        />
      );
      expect(screen.getByTestId('complete-icon')).toBeTruthy();
      expect(screen.getByText('Complete Example')).toBeTruthy();
      expect(screen.getByText('This has everything')).toBeTruthy();
      expect(screen.getByText('Take Action')).toBeTruthy();
    });
  });

  describe('Default Values for Variants', () => {
    it('shows default variant defaults when title is not provided', () => {
      render(<EmptyState title="" variant="default" />);
      expect(screen.getByText('Nothing here yet')).toBeTruthy();
    });

    it('uses variant description when description is undefined', () => {
      render(<EmptyState title="Custom" variant="transactions" />);
      expect(
        screen.getByText(
          'Your transactions will appear here once Monea reads your bank SMS messages.'
        )
      ).toBeTruthy();
    });

    it('does not show description when explicitly set to empty string', () => {
      render(<EmptyState title="Empty" description="" variant="transactions" />);
      expect(screen.getByText('Empty')).toBeTruthy();
      expect(
        screen.queryByText(
          'Your transactions will appear here once Monea reads your bank SMS messages.'
        )
      ).toBeNull();
    });
  });

  describe('Text Styling', () => {
    it('renders title with proper styling', () => {
      render(<EmptyState title="Styled Title" />);
      expect(screen.getByText('Styled Title')).toBeTruthy();
    });

    it('renders description with proper styling', () => {
      render(<EmptyState title="Title" description="Styled description" />);
      expect(screen.getByText('Styled description')).toBeTruthy();
    });
  });

  describe('Layout', () => {
    it('renders in centered container', () => {
      render(<EmptyState title="Centered" />);
      expect(screen.getByText('Centered')).toBeTruthy();
    });

    it('renders all elements in correct order', () => {
      const icon = <View testID="ordered-icon" />;
      const onAction = jest.fn();
      render(
        <EmptyState
          title="Order Test"
          description="Description"
          icon={icon}
          actionLabel="Action"
          onAction={onAction}
        />
      );
      expect(screen.getByTestId('ordered-icon')).toBeTruthy();
      expect(screen.getByText('Order Test')).toBeTruthy();
      expect(screen.getByText('Description')).toBeTruthy();
      expect(screen.getByText('Action')).toBeTruthy();
    });
  });
});
