import type { TransactionType, CategoryIcon } from '@/infrastructure/database';
import type { BankCode, AccountType } from '@/infrastructure/database/models/Account';

export interface BackupMetadata {
  version: number;
  exportedAt: string;
  app: {
    name: string;
    version: string;
  };
}

export interface AccountExport {
  id: string;
  bankCode: BankCode;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  isActive: boolean;
  lastSyncedAt: number | null;
  createdAt: number;
}

export interface TransactionExport {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: number;
  balanceAfter: number | null;
  merchant: string | null;
  description: string | null;
  reference: string | null;
  transactionDate: number;
  createdAt: number;
}

export interface CategoryExport {
  id: string;
  name: string;
  icon: CategoryIcon;
  color: string;
  isSystem: boolean;
  isIncome: boolean;
  createdAt: number;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: {
    accounts: AccountExport[];
    transactions: TransactionExport[];
    categories: CategoryExport[];
  };
}

export interface BackupStats {
  accountCount: number;
  transactionCount: number;
  categoryCount: number;
  dateRange: {
    earliest: Date | null;
    latest: Date | null;
  };
  estimatedSize: string;
}

export interface ImportResult {
  success: boolean;
  imported: {
    accounts: number;
    transactions: number;
    categories: number;
  };
  skipped: {
    accounts: number;
    transactions: number;
    categories: number;
  };
  errors: string[];
}

export type ImportStrategy = 'merge' | 'replace';

export const BACKUP_VERSION = 1;
export const APP_NAME = 'monea';
export const APP_VERSION = '1.0.0';
