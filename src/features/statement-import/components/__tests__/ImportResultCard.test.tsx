import { render, screen } from '@testing-library/react-native';

import { ImportResultCard } from '../ImportResultCard';

import type { ImportResultCardProps } from '../ImportResultCard';
import type { ImportResult } from '../../types';

const createDefaultResult = (overrides: Partial<ImportResult> = {}): ImportResult => ({
  success: true,
  statementImportId: 'import-123',
  transactions: {
    total: 25,
    imported: 20,
    skipped: 2,
    duplicates: 3,
  },
  account: {
    id: 'account-1',
    accountNumber: '12345678901',
    previousBalance: 1000000,
    newBalance: 1500000,
  },
  bankCode: 'bancolombia',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
  errors: [],
  duplicates: [],
  periodOverlaps: [],
  ...overrides,
});

const createDefaultProps = (
  overrides: Partial<ImportResultCardProps> = {}
): ImportResultCardProps => ({
  result: createDefaultResult(),
  ...overrides,
});

describe('ImportResultCard', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByTestId('import-result-card')).toBeTruthy();
    });

    it('displays success status for successful imports', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByText('Import Complete with Warnings')).toBeTruthy();
    });

    it('displays bank code', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByText(/BANCOLOMBIA/)).toBeTruthy();
    });

    it('displays import count in subtitle', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByText(/20 transactions imported/)).toBeTruthy();
    });
  });

  describe('Status Display', () => {
    it('shows success status when all transactions imported without issues', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              transactions: { total: 10, imported: 10, skipped: 0, duplicates: 0 },
            }),
          })}
        />
      );
      expect(screen.getByText('Import Complete')).toBeTruthy();
      expect(screen.getByText('✅')).toBeTruthy();
    });

    it('shows error status when import fails', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({ success: false }),
          })}
        />
      );
      expect(screen.getByText('Import Failed')).toBeTruthy();
      expect(screen.getByText('❌')).toBeTruthy();
    });

    it('shows partial status when some transactions skipped', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              transactions: { total: 10, imported: 8, skipped: 2, duplicates: 0 },
            }),
          })}
        />
      );
      expect(screen.getByText('Import Complete with Warnings')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });

    it('shows partial status when errors exist', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              transactions: { total: 10, imported: 10, skipped: 0, duplicates: 0 },
              errors: [{ message: 'Test error' }],
            }),
          })}
        />
      );
      expect(screen.getByText('Import Complete with Warnings')).toBeTruthy();
    });
  });

  describe('Transaction Summary', () => {
    it('displays total transaction count', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByTestId('stat-total')).toHaveTextContent('25');
    });

    it('displays imported count', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByTestId('stat-imported')).toHaveTextContent('20');
    });

    it('displays duplicates count', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByTestId('stat-duplicates')).toHaveTextContent('3');
    });

    it('displays skipped count', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByTestId('stat-skipped')).toHaveTextContent('2');
    });
  });

  describe('Period Display', () => {
    it('displays period date range', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      const periodRange = screen.getByTestId('period-range');
      expect(periodRange).toBeTruthy();
    });
  });

  describe('Account Information', () => {
    it('displays masked account number', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByText(/\*\*\*\*8901/)).toBeTruthy();
    });

    it('displays previous balance when available', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByText('Previous Balance')).toBeTruthy();
    });

    it('displays new balance', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      expect(screen.getByTestId('new-balance')).toBeTruthy();
    });

    it('displays positive balance change with plus sign', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              account: {
                id: 'account-1',
                accountNumber: '12345678901',
                previousBalance: 1000000,
                newBalance: 1500000,
              },
            }),
          })}
        />
      );
      expect(screen.getByTestId('balance-change')).toBeTruthy();
    });

    it('does not display account section when account is null', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({ account: null }),
          })}
        />
      );
      expect(screen.queryByText('Account Updated')).toBeNull();
    });

    it('does not display change when previous balance is undefined', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              account: {
                id: 'account-1',
                accountNumber: '12345678901',
                previousBalance: undefined,
                newBalance: 1500000,
              },
            }),
          })}
        />
      );
      expect(screen.queryByTestId('balance-change')).toBeNull();
    });
  });

  describe('Warnings Display', () => {
    it('displays period overlap warnings', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              periodOverlaps: [
                {
                  importId: 'import-prev',
                  fileName: 'previous-statement.xlsx',
                  periodStart: new Date('2024-01-15'),
                  periodEnd: new Date('2024-01-31'),
                  overlapStart: new Date('2024-01-15'),
                  overlapEnd: new Date('2024-01-31'),
                  overlapDays: 17,
                },
              ],
            }),
          })}
        />
      );
      expect(screen.getByText('Period Overlaps')).toBeTruthy();
      expect(screen.getByText(/Overlaps 17 days/)).toBeTruthy();
    });

    it('displays duplicate warnings when duplicates exist', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              duplicates: [
                {
                  transaction: {
                    transactionDate: new Date('2024-01-15'),
                    amount: 50000,
                    description: 'Test transaction',
                    type: 'expense',
                    balanceAfter: 1000000,
                  },
                  matchedTransactionId: 'tx-123',
                  matchType: 'exact',
                },
              ],
            }),
          })}
        />
      );
      expect(screen.getByTestId('duplicates-warning')).toBeTruthy();
      expect(screen.getByText('Duplicates Skipped')).toBeTruthy();
      expect(screen.getByText(/1 duplicate transaction/)).toBeTruthy();
    });

    it('pluralizes duplicate warning correctly', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              duplicates: [
                {
                  transaction: {
                    transactionDate: new Date('2024-01-15'),
                    amount: 50000,
                    description: 'Test 1',
                    type: 'expense',
                    balanceAfter: 1000000,
                  },
                  matchedTransactionId: 'tx-1',
                  matchType: 'exact',
                },
                {
                  transaction: {
                    transactionDate: new Date('2024-01-16'),
                    amount: 60000,
                    description: 'Test 2',
                    type: 'expense',
                    balanceAfter: 900000,
                  },
                  matchedTransactionId: 'tx-2',
                  matchType: 'likely',
                },
              ],
            }),
          })}
        />
      );
      expect(screen.getByText(/2 duplicate transactions/)).toBeTruthy();
    });
  });

  describe('Errors Display', () => {
    it('displays errors section when errors exist', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              errors: [{ message: 'Failed to parse row' }],
            }),
          })}
        />
      );
      expect(screen.getByTestId('errors-section')).toBeTruthy();
      expect(screen.getByText('Errors (1)')).toBeTruthy();
    });

    it('displays error message', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              errors: [{ message: 'Invalid amount format' }],
            }),
          })}
        />
      );
      expect(screen.getByText('Invalid amount format')).toBeTruthy();
    });

    it('includes row number in error when transactionIndex provided', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              errors: [{ message: 'Invalid date', transactionIndex: 5 }],
            }),
          })}
        />
      );
      expect(screen.getByText(/Row 6:/)).toBeTruthy();
    });

    it('includes amount in error when provided', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              errors: [{ message: 'Invalid entry', transactionIndex: 2, amount: 50000 }],
            }),
          })}
        />
      );
      expect(screen.getByText(/Row 3:/)).toBeTruthy();
    });

    it('truncates errors list when more than 5 errors', () => {
      const errors = Array.from({ length: 8 }, (_, i) => ({
        message: `Error ${i + 1}`,
      }));

      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({ errors }),
          })}
        />
      );

      expect(screen.getByText('Errors (8)')).toBeTruthy();
      expect(screen.getByText('Error 1')).toBeTruthy();
      expect(screen.getByText('Error 5')).toBeTruthy();
      expect(screen.queryByText('Error 6')).toBeNull();
      expect(screen.getByText(/\.\.\. and 3 more errors/)).toBeTruthy();
    });

    it('correctly pluralizes remaining errors count', () => {
      const errors = Array.from({ length: 6 }, (_, i) => ({
        message: `Error ${i + 1}`,
      }));

      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({ errors }),
          })}
        />
      );

      expect(screen.getByText(/\.\.\. and 1 more error$/)).toBeTruthy();
    });
  });

  describe('Reconciliation Display', () => {
    it('displays reconciliation success', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              reconciliation: {
                success: true,
                result: {
                  accountId: 'account-1',
                  previousBalance: 1000000,
                  newBalance: 1500000,
                  balanceSource: 'statement_closing',
                  discrepancy: 0,
                  reconciledAt: new Date(),
                  statementPeriodEnd: new Date('2024-01-31'),
                },
                errors: [],
                warnings: [],
              },
            }),
          })}
        />
      );
      expect(screen.getByText('Balance Reconciliation')).toBeTruthy();
      expect(screen.getByText(/Balance reconciled from statement closing/)).toBeTruthy();
    });

    it('displays reconciliation error', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              reconciliation: {
                success: false,
                result: null,
                errors: [{ code: 'account_not_found', message: 'Account not found in database' }],
                warnings: [],
              },
            }),
          })}
        />
      );
      expect(screen.getByTestId('reconciliation-error')).toBeTruthy();
      expect(screen.getByText('Account not found in database')).toBeTruthy();
    });

    it('displays reconciliation warnings', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              reconciliation: {
                success: true,
                result: {
                  accountId: 'account-1',
                  previousBalance: 1000000,
                  newBalance: 1500000,
                  balanceSource: 'calculated',
                  discrepancy: 1000,
                  reconciledAt: new Date(),
                  statementPeriodEnd: new Date('2024-01-31'),
                },
                errors: [],
                warnings: [
                  {
                    code: 'balance_discrepancy',
                    message: 'Balance differs from statement by $1,000',
                  },
                ],
              },
            }),
          })}
        />
      );
      expect(screen.getByTestId('reconciliation-warnings')).toBeTruthy();
      expect(screen.getByText('Balance differs from statement by $1,000')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      const card = screen.getByTestId('import-result-card');
      expect(card.props.accessibilityRole).toBe('summary');
    });

    it('has descriptive accessibility label', () => {
      render(<ImportResultCard {...createDefaultProps()} />);
      const card = screen.getByTestId('import-result-card');
      expect(card.props.accessibilityLabel).toContain('Import result');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero transactions gracefully', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              transactions: { total: 0, imported: 0, skipped: 0, duplicates: 0 },
            }),
          })}
        />
      );
      expect(screen.getByTestId('stat-total')).toHaveTextContent('0');
    });

    it('handles different bank codes', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({ bankCode: 'nequi' }),
          })}
        />
      );
      expect(screen.getByText(/NEQUI/)).toBeTruthy();
    });

    it('handles negative balance change', () => {
      render(
        <ImportResultCard
          {...createDefaultProps({
            result: createDefaultResult({
              account: {
                id: 'account-1',
                accountNumber: '12345678901',
                previousBalance: 2000000,
                newBalance: 1500000,
              },
            }),
          })}
        />
      );
      expect(screen.getByTestId('balance-change')).toBeTruthy();
    });
  });
});
