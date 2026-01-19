import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import {
  database,
  AccountRepository,
  TransactionRepository,
  CategoryRepository,
} from '@/infrastructure/database';

import { BACKUP_VERSION, APP_NAME, APP_VERSION } from '../types';

import type {
  BackupData,
  BackupStats,
  ImportResult,
  ImportStrategy,
  AccountExport,
  TransactionExport,
  CategoryExport,
} from '../types';
import type Account from '@/infrastructure/database/models/Account';
import type Category from '@/infrastructure/database/models/Category';
import type Transaction from '@/infrastructure/database/models/Transaction';

function accountToExport(account: Account): AccountExport {
  return {
    id: account.id,
    bankCode: account.bankCode,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    isActive: account.isActive,
    lastSyncedAt: account.lastSyncedAt ?? null,
    createdAt: account.createdAt.getTime(),
  };
}

function transactionToExport(transaction: Transaction): TransactionExport {
  return {
    id: transaction.id,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId ?? null,
    type: transaction.type,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter ?? null,
    merchant: transaction.merchant ?? null,
    description: transaction.description ?? null,
    reference: transaction.reference ?? null,
    transactionDate: transaction.transactionDate.getTime(),
    createdAt: transaction.createdAt.getTime(),
  };
}

function categoryToExport(category: Category): CategoryExport {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    isSystem: category.isSystem,
    isIncome: category.isIncome,
    createdAt: category.createdAt.getTime(),
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export class BackupService {
  private accountRepo: AccountRepository;
  private transactionRepo: TransactionRepository;
  private categoryRepo: CategoryRepository;

  constructor() {
    this.accountRepo = new AccountRepository(database);
    this.transactionRepo = new TransactionRepository(database);
    this.categoryRepo = new CategoryRepository(database);
  }

  async getBackupStats(): Promise<BackupStats> {
    const accounts = await this.accountRepo.findAll();
    const transactions = await this.transactionRepo.findAll();
    const categories = await this.categoryRepo.findCustomCategories();

    let earliest: Date | null = null;
    let latest: Date | null = null;

    for (const t of transactions) {
      if (!earliest || t.transactionDate < earliest) {
        earliest = t.transactionDate;
      }
      if (!latest || t.transactionDate > latest) {
        latest = t.transactionDate;
      }
    }

    const estimatedBytes =
      JSON.stringify(accounts).length +
      JSON.stringify(transactions).length +
      JSON.stringify(categories).length +
      500;

    return {
      accountCount: accounts.length,
      transactionCount: transactions.length,
      categoryCount: categories.length,
      dateRange: { earliest, latest },
      estimatedSize: formatFileSize(estimatedBytes),
    };
  }

  async exportToJson(): Promise<BackupData> {
    const accounts = await this.accountRepo.findAll();
    const transactions = await this.transactionRepo.findAll();
    const categories = await this.categoryRepo.findCustomCategories();

    const backupData: BackupData = {
      metadata: {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        app: {
          name: APP_NAME,
          version: APP_VERSION,
        },
      },
      data: {
        accounts: accounts.map(accountToExport),
        transactions: transactions.map(transactionToExport),
        categories: categories.map(categoryToExport),
      },
    };

    return backupData;
  }

  async exportAndShare(): Promise<boolean> {
    const backupData = await this.exportToJson();
    const jsonString = JSON.stringify(backupData, null, 2);

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `monea-backup-${timestamp}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Monea Backup',
      UTI: 'public.json',
    });

    await FileSystem.deleteAsync(filePath, { idempotent: true });

    return true;
  }

  async pickBackupFile(): Promise<string | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const firstAsset = result.assets[0];
    return firstAsset?.uri ?? null;
  }

  async readBackupFile(uri: string): Promise<BackupData> {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const data = JSON.parse(content) as BackupData;
    this.validateBackupData(data);

    return data;
  }

  private validateBackupData(data: unknown): asserts data is BackupData {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file: not a valid JSON object');
    }

    const backup = data as Record<string, unknown>;

    if (!backup.metadata || typeof backup.metadata !== 'object') {
      throw new Error('Invalid backup file: missing metadata');
    }

    const metadata = backup.metadata as Record<string, unknown>;
    if (typeof metadata.version !== 'number') {
      throw new Error('Invalid backup file: missing version');
    }

    if (metadata.version > BACKUP_VERSION) {
      throw new Error(
        `Backup file version ${metadata.version} is newer than supported version ${BACKUP_VERSION}`
      );
    }

    if (!backup.data || typeof backup.data !== 'object') {
      throw new Error('Invalid backup file: missing data');
    }

    const backupDataContent = backup.data as Record<string, unknown>;
    if (!Array.isArray(backupDataContent.accounts)) {
      throw new Error('Invalid backup file: missing accounts array');
    }
    if (!Array.isArray(backupDataContent.transactions)) {
      throw new Error('Invalid backup file: missing transactions array');
    }
    if (!Array.isArray(backupDataContent.categories)) {
      throw new Error('Invalid backup file: missing categories array');
    }
  }

  async importFromBackup(
    backupData: BackupData,
    _strategy: ImportStrategy = 'merge'
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: { accounts: 0, transactions: 0, categories: 0 },
      skipped: { accounts: 0, transactions: 0, categories: 0 },
      errors: [],
    };

    const accountIdMap = new Map<string, string>();
    const categoryIdMap = new Map<string, string>();

    for (const categoryData of backupData.data.categories) {
      try {
        if (categoryData.isSystem) {
          result.skipped.categories++;
          continue;
        }

        const existing = await this.categoryRepo.existsByName(categoryData.name);
        if (existing) {
          result.skipped.categories++;
          continue;
        }

        const newCategory = await this.categoryRepo.create({
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          isIncome: categoryData.isIncome,
          isSystem: false,
        });

        categoryIdMap.set(categoryData.id, newCategory.id);
        result.imported.categories++;
      } catch (error) {
        result.errors.push(
          `Failed to import category "${categoryData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    for (const accountData of backupData.data.accounts) {
      try {
        const existing = await this.accountRepo.existsByAccountNumber(accountData.accountNumber);
        if (existing) {
          const existingAccount = await this.accountRepo.findByAccountNumber(
            accountData.accountNumber
          );
          if (existingAccount) {
            accountIdMap.set(accountData.id, existingAccount.id);
          }
          result.skipped.accounts++;
          continue;
        }

        const newAccount = await this.accountRepo.create({
          bankCode: accountData.bankCode,
          bankName: accountData.bankName,
          accountNumber: accountData.accountNumber,
          accountType: accountData.accountType,
          balance: accountData.balance,
          isActive: accountData.isActive,
        });

        accountIdMap.set(accountData.id, newAccount.id);
        result.imported.accounts++;
      } catch (error) {
        result.errors.push(
          `Failed to import account "${accountData.bankName}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    for (const transactionData of backupData.data.transactions) {
      try {
        const newAccountId = accountIdMap.get(transactionData.accountId);
        if (!newAccountId) {
          result.skipped.transactions++;
          continue;
        }

        const newCategoryId = transactionData.categoryId
          ? categoryIdMap.get(transactionData.categoryId)
          : undefined;

        await this.transactionRepo.create({
          accountId: newAccountId,
          type: transactionData.type,
          amount: transactionData.amount,
          transactionDate: new Date(transactionData.transactionDate),
          categoryId: newCategoryId,
          balanceAfter: transactionData.balanceAfter ?? undefined,
          merchant: transactionData.merchant ?? undefined,
          description: transactionData.description ?? undefined,
          reference: transactionData.reference ?? undefined,
        });

        result.imported.transactions++;
      } catch (error) {
        result.errors.push(
          `Failed to import transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }
}

export const backupService = new BackupService();
