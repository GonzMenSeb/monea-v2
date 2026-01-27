import { AccountRepository } from '@/infrastructure/database/repositories/AccountRepository';
import { TransactionRepository } from '@/infrastructure/database/repositories/TransactionRepository';

import type {
  ReconciliationResult,
  ReconciliationSummary,
  ReconciliationError,
  ReconciliationWarning,
  BalanceCheckpoint,
} from '../types';
import type { StatementAccountInfo, StatementTransaction } from '@/core/parser/statement';
import type { Database } from '@nozbe/watermelondb';

const DISCREPANCY_WARNING_THRESHOLD = 0.01;
const STALE_DAYS_THRESHOLD = 30;

export interface ReconciliationInput {
  accountId: string;
  statementAccount: StatementAccountInfo;
  transactions: StatementTransaction[];
  statementImportId?: string;
  dryRun?: boolean;
}

export class BalanceReconciliationService {
  private readonly accountRepo: AccountRepository;
  private readonly transactionRepo: TransactionRepository;

  constructor(private readonly database: Database) {
    this.accountRepo = new AccountRepository(database);
    this.transactionRepo = new TransactionRepository(database);
  }

  async reconcile(input: ReconciliationInput): Promise<ReconciliationSummary> {
    const errors: ReconciliationError[] = [];
    const warnings: ReconciliationWarning[] = [];
    const statementClosingBalance = input.statementAccount.closingBalance;

    if (input.dryRun) {
      return this.createDryRunResult(input, statementClosingBalance, warnings);
    }

    const account = await this.accountRepo.findById(input.accountId);
    if (!account) {
      errors.push({
        code: 'account_not_found',
        message: `Account with ID ${input.accountId} not found`,
      });
      return { success: false, result: null, errors, warnings };
    }

    const previousBalance = account.balance;

    if (!Number.isFinite(statementClosingBalance)) {
      errors.push({
        code: 'invalid_balance',
        message: 'Statement closing balance is not a valid number',
      });
      return { success: false, result: null, errors, warnings };
    }

    const discrepancy = Math.abs(previousBalance - statementClosingBalance);
    if (discrepancy > DISCREPANCY_WARNING_THRESHOLD) {
      warnings.push({
        code: 'balance_discrepancy',
        message: `Balance differs by ${discrepancy.toFixed(2)} from statement`,
        details: {
          previousBalance,
          statementClosingBalance,
          difference: statementClosingBalance - previousBalance,
        },
      });
    }

    const futureTransactions = await this.findTransactionsAfterDate(
      input.accountId,
      input.statementAccount.periodEnd
    );
    if (futureTransactions.length > 0) {
      warnings.push({
        code: 'future_transactions_exist',
        message: `${futureTransactions.length} transactions exist after statement period end`,
        details: {
          count: futureTransactions.length,
          statementPeriodEnd: input.statementAccount.periodEnd.toISOString(),
        },
      });
    }

    const lastReconciliationDate = await this.getLastReconciliationDate(input.accountId);
    if (lastReconciliationDate) {
      const daysSinceReconciliation = this.daysBetween(
        lastReconciliationDate,
        input.statementAccount.periodEnd
      );
      if (daysSinceReconciliation > STALE_DAYS_THRESHOLD) {
        warnings.push({
          code: 'stale_reconciliation',
          message: `Last reconciliation was ${daysSinceReconciliation} days before statement period end`,
          details: {
            lastReconciliationDate: lastReconciliationDate.toISOString(),
            daysSinceReconciliation,
          },
        });
      }
    }

    if (!input.dryRun) {
      try {
        await this.accountRepo.updateBalance(input.accountId, statementClosingBalance);
        await this.accountRepo.updateLastSynced(input.accountId);
      } catch (err) {
        errors.push({
          code: 'balance_update_failed',
          message: err instanceof Error ? err.message : 'Failed to update account balance',
        });
        return { success: false, result: null, errors, warnings };
      }
    }

    const result: ReconciliationResult = {
      accountId: input.accountId,
      previousBalance,
      newBalance: statementClosingBalance,
      balanceSource: 'statement_closing',
      discrepancy,
      reconciledAt: new Date(),
      statementPeriodEnd: input.statementAccount.periodEnd,
    };

    return { success: true, result, errors, warnings };
  }

  async getBalanceCheckpoints(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BalanceCheckpoint[]> {
    const transactions = await this.transactionRepo.findByFilters({
      accountId,
      startDate,
      endDate,
    });

    const checkpoints: BalanceCheckpoint[] = [];
    for (const tx of transactions) {
      if (tx.balanceAfter !== undefined && tx.balanceAfter !== null) {
        checkpoints.push({
          date: tx.transactionDate,
          balance: tx.balanceAfter,
          source: tx.statementImportId ? 'statement' : 'transaction',
          transactionId: tx.id,
          statementImportId: tx.statementImportId ?? undefined,
        });
      }
    }

    return checkpoints.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  validateRunningBalances(
    _accountId: string,
    transactions: StatementTransaction[]
  ): {
    valid: boolean;
    discrepancies: Array<{ index: number; expected: number; actual: number }>;
  } {
    if (transactions.length === 0) {
      return { valid: true, discrepancies: [] };
    }

    const discrepancies: Array<{ index: number; expected: number; actual: number }> = [];
    const sortedTransactions = [...transactions].sort(
      (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime()
    );

    for (let i = 1; i < sortedTransactions.length; i++) {
      const prev = sortedTransactions[i - 1];
      const curr = sortedTransactions[i];

      if (prev?.balanceAfter === undefined || curr?.balanceBefore === undefined) {
        continue;
      }

      if (Math.abs(prev.balanceAfter - curr.balanceBefore) > DISCREPANCY_WARNING_THRESHOLD) {
        discrepancies.push({
          index: i,
          expected: prev.balanceAfter,
          actual: curr.balanceBefore,
        });
      }
    }

    return { valid: discrepancies.length === 0, discrepancies };
  }

  async getAccountBalanceAtDate(accountId: string, date: Date): Promise<number | null> {
    const transactions = await this.transactionRepo.findByFilters({
      accountId,
      endDate: date,
    });

    const sortedByDate = transactions
      .filter((t) => t.balanceAfter !== undefined && t.balanceAfter !== null)
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

    const closestTransaction = sortedByDate[0];
    return closestTransaction?.balanceAfter ?? null;
  }

  async calculateExpectedBalance(accountId: string): Promise<number> {
    return this.transactionRepo.getCalculatedBalanceByAccountId(accountId);
  }

  private async findTransactionsAfterDate(
    accountId: string,
    date: Date
  ): Promise<Array<{ id: string; transactionDate: Date }>> {
    const searchStart = new Date(date.getTime() + 1);
    const transactions = await this.transactionRepo.findByFilters({
      accountId,
      startDate: searchStart,
    });

    return transactions.map((t) => ({
      id: t.id,
      transactionDate: t.transactionDate,
    }));
  }

  private async getLastReconciliationDate(accountId: string): Promise<Date | null> {
    const latestBalance = await this.transactionRepo.getLatestBalanceAfterByAccountId(accountId);
    if (latestBalance === null) {
      return null;
    }

    const transactions = await this.transactionRepo.findByFilters({ accountId });
    const withBalance = transactions
      .filter((t) => t.balanceAfter !== undefined && t.balanceAfter !== null)
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

    return withBalance[0]?.transactionDate ?? null;
  }

  private daysBetween(date1: Date, date2: Date): number {
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private createDryRunResult(
    input: ReconciliationInput,
    statementClosingBalance: number,
    warnings: ReconciliationWarning[]
  ): ReconciliationSummary {
    const result: ReconciliationResult = {
      accountId: input.accountId,
      previousBalance: 0,
      newBalance: statementClosingBalance,
      balanceSource: 'statement_closing',
      discrepancy: 0,
      reconciledAt: new Date(),
      statementPeriodEnd: input.statementAccount.periodEnd,
    };

    return { success: true, result, errors: [], warnings };
  }
}

let balanceReconciliationServiceInstance: BalanceReconciliationService | null = null;

export function getBalanceReconciliationService(database: Database): BalanceReconciliationService {
  if (!balanceReconciliationServiceInstance) {
    balanceReconciliationServiceInstance = new BalanceReconciliationService(database);
  }
  return balanceReconciliationServiceInstance;
}

export function resetBalanceReconciliationService(): void {
  balanceReconciliationServiceInstance = null;
}
