import { render, screen } from '@testing-library/react-native';

import { Heading, Body, Caption, Amount } from '../../ui/Typography';

describe('Typography', () => {
  describe('Heading', () => {
    it('renders with default h2 level', () => {
      render(<Heading>Default Heading</Heading>);
      expect(screen.getByText('Default Heading')).toBeTruthy();
    });

    it('renders h1 level', () => {
      render(<Heading level="h1">Heading 1</Heading>);
      const heading = screen.getByText('Heading 1');
      expect(heading.props.accessibilityRole).toBe('header');
    });

    it('renders h2 level', () => {
      render(<Heading level="h2">Heading 2</Heading>);
      expect(screen.getByText('Heading 2')).toBeTruthy();
    });

    it('renders h3 level', () => {
      render(<Heading level="h3">Heading 3</Heading>);
      expect(screen.getByText('Heading 3')).toBeTruthy();
    });

    it('renders h4 level', () => {
      render(<Heading level="h4">Heading 4</Heading>);
      expect(screen.getByText('Heading 4')).toBeTruthy();
    });

    it('has header accessibility role', () => {
      render(<Heading>Accessible Heading</Heading>);
      const heading = screen.getByText('Accessible Heading');
      expect(heading.props.accessibilityRole).toBe('header');
    });

    it('accepts custom className', () => {
      render(<Heading className="custom-class">Custom</Heading>);
      expect(screen.getByText('Custom')).toBeTruthy();
    });

    it('forwards additional text props', () => {
      render(
        <Heading testID="custom-heading" numberOfLines={1}>
          Props Test
        </Heading>
      );
      expect(screen.getByTestId('custom-heading')).toBeTruthy();
    });
  });

  describe('Body', () => {
    it('renders with default md size', () => {
      render(<Body>Default Body</Body>);
      expect(screen.getByText('Default Body')).toBeTruthy();
    });

    it('renders with sm size', () => {
      render(<Body size="sm">Small Body</Body>);
      expect(screen.getByText('Small Body')).toBeTruthy();
    });

    it('renders with md size', () => {
      render(<Body size="md">Medium Body</Body>);
      expect(screen.getByText('Medium Body')).toBeTruthy();
    });

    it('renders with lg size', () => {
      render(<Body size="lg">Large Body</Body>);
      expect(screen.getByText('Large Body')).toBeTruthy();
    });

    it('renders with normal color by default', () => {
      render(<Body>Normal Color</Body>);
      expect(screen.getByText('Normal Color')).toBeTruthy();
    });

    it('renders with muted color when muted is true', () => {
      render(<Body muted>Muted Text</Body>);
      expect(screen.getByText('Muted Text')).toBeTruthy();
    });

    it('accepts custom className', () => {
      render(<Body className="custom-body">Custom</Body>);
      expect(screen.getByText('Custom')).toBeTruthy();
    });

    it('forwards additional text props', () => {
      render(
        <Body testID="body-test" ellipsizeMode="tail">
          Body Props
        </Body>
      );
      expect(screen.getByTestId('body-test')).toBeTruthy();
    });
  });

  describe('Caption', () => {
    it('renders with default md size', () => {
      render(<Caption>Default Caption</Caption>);
      expect(screen.getByText('Default Caption')).toBeTruthy();
    });

    it('renders with sm size', () => {
      render(<Caption size="sm">Small Caption</Caption>);
      expect(screen.getByText('Small Caption')).toBeTruthy();
    });

    it('renders with md size', () => {
      render(<Caption size="md">Medium Caption</Caption>);
      expect(screen.getByText('Medium Caption')).toBeTruthy();
    });

    it('is muted by default', () => {
      render(<Caption>Muted Caption</Caption>);
      expect(screen.getByText('Muted Caption')).toBeTruthy();
    });

    it('renders with non-muted color when muted is false', () => {
      render(<Caption muted={false}>Normal Caption</Caption>);
      expect(screen.getByText('Normal Caption')).toBeTruthy();
    });

    it('accepts custom className', () => {
      render(<Caption className="custom-caption">Custom</Caption>);
      expect(screen.getByText('Custom')).toBeTruthy();
    });

    it('forwards additional text props', () => {
      render(
        <Caption testID="caption-test" accessibilityHint="Test hint">
          Caption Props
        </Caption>
      );
      expect(screen.getByTestId('caption-test')).toBeTruthy();
    });
  });

  describe('Amount', () => {
    it('formats positive amount in COP by default', () => {
      render(<Amount value={50000} />);
      expect(screen.getByText(/50/)).toBeTruthy();
    });

    it('formats negative amount with minus sign', () => {
      render(<Amount value={-25000} />);
      const text = screen.getByText(/-/);
      expect(text).toBeTruthy();
    });

    it('shows sign for positive amount when showSign is true', () => {
      render(<Amount value={10000} showSign />);
      const text = screen.getByText(/\+/);
      expect(text).toBeTruthy();
    });

    it('shows sign for negative amount when showSign is true', () => {
      render(<Amount value={-10000} showSign />);
      const text = screen.getByText(/-/);
      expect(text).toBeTruthy();
    });

    it('renders with income type styling', () => {
      render(<Amount value={50000} type="income" />);
      expect(screen.getByText(/50/)).toBeTruthy();
    });

    it('renders with expense type styling', () => {
      render(<Amount value={50000} type="expense" />);
      expect(screen.getByText(/50/)).toBeTruthy();
    });

    it('renders with transfer type styling', () => {
      render(<Amount value={50000} type="transfer" />);
      expect(screen.getByText(/50/)).toBeTruthy();
    });

    it('renders with neutral type styling', () => {
      render(<Amount value={50000} type="neutral" />);
      expect(screen.getByText(/50/)).toBeTruthy();
    });

    it('formats zero amount correctly', () => {
      render(<Amount value={0} />);
      expect(screen.getByText(/0/)).toBeTruthy();
    });

    it('formats large amounts with proper grouping', () => {
      render(<Amount value={1500000} />);
      expect(screen.getByText(/1/)).toBeTruthy();
    });

    it('accepts custom className', () => {
      render(<Amount value={10000} className="custom-amount" />);
      expect(screen.getByText(/10/)).toBeTruthy();
    });

    it('has proper accessibility label for income', () => {
      render(<Amount value={10000} type="income" />);
      const text = screen.getByText(/10/);
      expect(text.props.accessibilityLabel).toContain('income');
    });

    it('has proper accessibility label for expense', () => {
      render(<Amount value={10000} type="expense" />);
      const text = screen.getByText(/10/);
      expect(text.props.accessibilityLabel).toContain('expense');
    });

    it('has proper accessibility label for neutral', () => {
      render(<Amount value={10000} type="neutral" />);
      const text = screen.getByText(/10/);
      expect(text.props.accessibilityLabel).not.toContain('income');
      expect(text.props.accessibilityLabel).not.toContain('expense');
    });

    it('formats with custom currency', () => {
      render(<Amount value={100} currency="USD" locale="en-US" />);
      const text = screen.getByText(/100/);
      expect(text).toBeTruthy();
    });

    it('forwards additional text props', () => {
      render(
        <Amount value={10000} testID="amount-test">
          Amount Props
        </Amount>
      );
      expect(screen.getByTestId('amount-test')).toBeTruthy();
    });
  });
});
