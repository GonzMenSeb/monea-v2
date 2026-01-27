import { render, screen } from '@testing-library/react-native';

import { ImportProgressCard } from '../ImportProgressCard';

import type { ImportProgressCardProps } from '../ImportProgressCard';
import type { ImportProgress } from '../../types';

const createDefaultProgress = (overrides: Partial<ImportProgress> = {}): ImportProgress => ({
  phase: 'importing',
  currentStep: 3,
  totalSteps: 5,
  message: 'Importing transactions...',
  fileName: 'statement-2024-01.xlsx',
  ...overrides,
});

const createDefaultProps = (
  overrides: Partial<ImportProgressCardProps> = {}
): ImportProgressCardProps => ({
  progress: createDefaultProgress(),
  transactionsCount: 15,
  ...overrides,
});

describe('ImportProgressCard', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ImportProgressCard {...createDefaultProps()} />);
      expect(screen.getByText('Importing Transactions')).toBeTruthy();
    });

    it('displays the progress message', () => {
      render(<ImportProgressCard {...createDefaultProps()} />);
      expect(screen.getByText('Importing transactions...')).toBeTruthy();
    });

    it('displays the file name', () => {
      render(<ImportProgressCard {...createDefaultProps()} />);
      expect(screen.getByText('📄 statement-2024-01.xlsx')).toBeTruthy();
    });

    it('displays step progress', () => {
      render(<ImportProgressCard {...createDefaultProps()} />);
      expect(screen.getByText('Step 3 of 5')).toBeTruthy();
    });

    it('displays percentage progress', () => {
      render(<ImportProgressCard {...createDefaultProps()} />);
      expect(screen.getAllByText('60%').length).toBeGreaterThan(0);
    });

    it('displays transactions count when provided', () => {
      render(<ImportProgressCard {...createDefaultProps({ transactionsCount: 42 })} />);
      expect(screen.getByTestId('transactions-count')).toBeTruthy();
      expect(screen.getByText('42')).toBeTruthy();
    });

    it('does not display transactions section when not provided', () => {
      render(<ImportProgressCard {...createDefaultProps({ transactionsCount: undefined })} />);
      expect(screen.queryByTestId('transactions-count')).toBeNull();
    });
  });

  describe('Phase Display', () => {
    it('displays reading phase correctly', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'reading' }),
          })}
        />
      );
      expect(screen.getByText('Reading File')).toBeTruthy();
      expect(screen.getByText('📖')).toBeTruthy();
    });

    it('displays parsing phase correctly', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'parsing' }),
          })}
        />
      );
      expect(screen.getByText('Parsing Statement')).toBeTruthy();
      expect(screen.getByText('🔍')).toBeTruthy();
    });

    it('displays detecting_duplicates phase correctly', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'detecting_duplicates' }),
          })}
        />
      );
      expect(screen.getByText('Checking Duplicates')).toBeTruthy();
      expect(screen.getByText('🔎')).toBeTruthy();
    });

    it('displays importing phase correctly', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'importing' }),
          })}
        />
      );
      expect(screen.getByText('Importing Transactions')).toBeTruthy();
      expect(screen.getByText('💾')).toBeTruthy();
    });

    it('displays updating_balances phase correctly', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'updating_balances' }),
          })}
        />
      );
      expect(screen.getByText('Updating Balances')).toBeTruthy();
      expect(screen.getByText('📊')).toBeTruthy();
    });

    it('displays complete phase correctly', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'complete' }),
          })}
        />
      );
      expect(screen.getByText('Complete')).toBeTruthy();
      expect(screen.getByText('✅')).toBeTruthy();
    });
  });

  describe('Status Display', () => {
    it('shows "In Progress" when not complete', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'importing' }),
          })}
        />
      );
      expect(screen.getByTestId('import-status')).toHaveTextContent('In Progress');
    });

    it('shows "Done" when complete', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'complete' }),
          })}
        />
      );
      expect(screen.getByTestId('import-status')).toHaveTextContent('Done');
    });
  });

  describe('Progress Calculation', () => {
    it('calculates 0% when at step 0', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ currentStep: 0, totalSteps: 5 }),
          })}
        />
      );
      expect(screen.getByText('Step 0 of 5')).toBeTruthy();
      expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    });

    it('calculates 100% when complete', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ currentStep: 5, totalSteps: 5 }),
          })}
        />
      );
      expect(screen.getByText('Step 5 of 5')).toBeTruthy();
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    });

    it('handles totalSteps of 0 without error', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ currentStep: 0, totalSteps: 0 }),
          })}
        />
      );
      expect(screen.getByText('Step 0 of 0')).toBeTruthy();
      expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    });

    it('rounds percentage correctly', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ currentStep: 1, totalSteps: 3 }),
          })}
        />
      );
      expect(screen.getAllByText('33%').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      render(<ImportProgressCard {...createDefaultProps()} />);
      const card = screen.getByLabelText('Import progress: Importing Transactions, 60% complete');
      expect(card.props.accessibilityRole).toBe('progressbar');
    });

    it('has accessibility value with current progress', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ currentStep: 3, totalSteps: 5 }),
          })}
        />
      );
      const card = screen.getByLabelText('Import progress: Importing Transactions, 60% complete');
      expect(card.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 60,
      });
    });

    it('has descriptive accessibility label', () => {
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ phase: 'importing', currentStep: 3, totalSteps: 5 }),
          })}
        />
      );
      const card = screen.getByLabelText('Import progress: Importing Transactions, 60% complete');
      expect(card).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles long file names with truncation', () => {
      const longFileName =
        'very-long-file-name-that-exceeds-normal-display-width-2024-01-statement.xlsx';
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ fileName: longFileName }),
          })}
        />
      );
      expect(screen.getByText(`📄 ${longFileName}`)).toBeTruthy();
    });

    it('handles long messages with truncation', () => {
      const longMessage =
        'This is a very long progress message that describes in detail what is currently happening during the import process';
      render(
        <ImportProgressCard
          {...createDefaultProps({
            progress: createDefaultProgress({ message: longMessage }),
          })}
        />
      );
      expect(screen.getByText(longMessage)).toBeTruthy();
    });

    it('handles zero transactions count', () => {
      render(<ImportProgressCard {...createDefaultProps({ transactionsCount: 0 })} />);
      expect(screen.getByText('0')).toBeTruthy();
    });

    it('handles large transactions count', () => {
      render(<ImportProgressCard {...createDefaultProps({ transactionsCount: 9999 })} />);
      expect(screen.getByText('9999')).toBeTruthy();
    });
  });
});
