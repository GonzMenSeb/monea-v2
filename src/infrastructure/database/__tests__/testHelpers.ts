import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { Account, Category, Transaction, SmsMessage } from '../models';
import { schema } from '../schema';

import type { BankCode, AccountType } from '../models/Account';
import type { TransactionType } from '../models/Transaction';
import type { CategoryIcon } from '../models/Category';

export function createTestDatabase(): Database {
  const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
  });

  return new Database({
    adapter,
    modelClasses: [Account, Category, Transaction, SmsMessage],
  });
}

export async function resetDatabase(database: Database): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

export interface MockAccountData {
  bankCode?: BankCode;
  bankName?: string;
  accountNumber?: string;
  accountType?: AccountType;
  balance?: number;
  isActive?: boolean;
}

export async function createMockAccount(
  database: Database,
  data: MockAccountData = {}
): Promise<Account> {
  const accountsCollection = database.get<Account>('accounts');
  return database.write(async () => {
    return accountsCollection.create((account) => {
      account.bankCode = data.bankCode ?? 'bancolombia';
      account.bankName = data.bankName ?? 'Bancolombia';
      account.accountNumber = data.accountNumber ?? '1234567890';
      account.accountType = data.accountType ?? 'savings';
      account.balance = data.balance ?? 1000000;
      account.isActive = data.isActive ?? true;
    });
  });
}

export interface MockTransactionData {
  accountId: string;
  type?: TransactionType;
  amount?: number;
  transactionDate?: Date;
  categoryId?: string;
  balanceAfter?: number;
  merchant?: string;
  description?: string;
  reference?: string;
  smsId?: string;
  rawSms?: string;
}

export async function createMockTransaction(
  database: Database,
  data: MockTransactionData
): Promise<Transaction> {
  const transactionsCollection = database.get<Transaction>('transactions');
  return database.write(async () => {
    return transactionsCollection.create((transaction) => {
      transaction.accountId = data.accountId;
      transaction.type = data.type ?? 'expense';
      transaction.amount = data.amount ?? 50000;
      transaction.transactionDate = data.transactionDate ?? new Date('2024-01-15');
      if (data.categoryId) {
        transaction.categoryId = data.categoryId;
      }
      if (data.balanceAfter !== undefined) {
        transaction.balanceAfter = data.balanceAfter;
      }
      if (data.merchant) {
        transaction.merchant = data.merchant;
      }
      if (data.description) {
        transaction.description = data.description;
      }
      if (data.reference) {
        transaction.reference = data.reference;
      }
      if (data.smsId) {
        transaction.smsId = data.smsId;
      }
      if (data.rawSms) {
        transaction.rawSms = data.rawSms;
      }
    });
  });
}

export interface MockCategoryData {
  name?: string;
  icon?: CategoryIcon;
  color?: string;
  isSystem?: boolean;
  isIncome?: boolean;
}

export async function createMockCategory(
  database: Database,
  data: MockCategoryData = {}
): Promise<Category> {
  const categoriesCollection = database.get<Category>('categories');
  return database.write(async () => {
    return categoriesCollection.create((category) => {
      category.name = data.name ?? 'Food';
      category.icon = data.icon ?? 'food';
      category.color = data.color ?? '#FF5733';
      category.isSystem = data.isSystem ?? false;
      category.isIncome = data.isIncome ?? false;
    });
  });
}
