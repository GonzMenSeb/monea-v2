import { Q } from '@nozbe/watermelondb';

import type Account from '../models/Account';
import type { BankCode, AccountType } from '../models/Account';
import type { Database, Query } from '@nozbe/watermelondb';

export interface CreateAccountData {
  bankCode: BankCode;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  balance?: number;
  isActive?: boolean;
}

export interface UpdateAccountData {
  bankCode?: BankCode;
  bankName?: string;
  accountNumber?: string;
  accountType?: AccountType;
  balance?: number;
  isActive?: boolean;
  lastSyncedAt?: number;
}

export interface AccountFilters {
  bankCode?: BankCode;
  accountType?: AccountType;
  isActive?: boolean;
  minBalance?: number;
  maxBalance?: number;
}

export interface AccountSummary {
  totalBalance: number;
  accountCount: number;
  activeCount: number;
  byBank: Record<BankCode, number>;
}

export class AccountRepository {
  private collection;

  constructor(private database: Database) {
    this.collection = database.get<Account>('accounts');
  }

  async findById(id: string): Promise<Account | null> {
    try {
      return await this.collection.find(id);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<Account[]> {
    return this.collection.query().fetch();
  }

  async findActive(): Promise<Account[]> {
    return this.collection.query(Q.where('is_active', true)).fetch();
  }

  async findByBankCode(bankCode: BankCode): Promise<Account[]> {
    return this.collection.query(Q.where('bank_code', bankCode)).fetch();
  }

  async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    const results = await this.collection.query(Q.where('account_number', accountNumber)).fetch();
    return results[0] ?? null;
  }

  async findByAccountType(accountType: AccountType): Promise<Account[]> {
    return this.collection.query(Q.where('account_type', accountType)).fetch();
  }

  async findByFilters(filters: AccountFilters): Promise<Account[]> {
    const conditions: Q.Clause[] = [];

    if (filters.bankCode) {
      conditions.push(Q.where('bank_code', filters.bankCode));
    }
    if (filters.accountType) {
      conditions.push(Q.where('account_type', filters.accountType));
    }
    if (filters.isActive !== undefined) {
      conditions.push(Q.where('is_active', filters.isActive));
    }
    if (filters.minBalance !== undefined) {
      conditions.push(Q.where('balance', Q.gte(filters.minBalance)));
    }
    if (filters.maxBalance !== undefined) {
      conditions.push(Q.where('balance', Q.lte(filters.maxBalance)));
    }

    return this.collection.query(...conditions).fetch();
  }

  observeAll(): Query<Account> {
    return this.collection.query(Q.sortBy('bank_name', Q.asc));
  }

  observeActive(): Query<Account> {
    return this.collection.query(Q.where('is_active', true), Q.sortBy('bank_name', Q.asc));
  }

  observeById(id: string): Query<Account> {
    return this.collection.query(Q.where('id', id));
  }

  async create(data: CreateAccountData): Promise<Account> {
    return this.database.write(async () => {
      return this.collection.create((account) => {
        account.bankCode = data.bankCode;
        account.bankName = data.bankName;
        account.accountNumber = data.accountNumber;
        account.accountType = data.accountType;
        account.balance = data.balance ?? 0;
        account.isActive = data.isActive ?? true;
      });
    });
  }

  async createBatch(dataList: CreateAccountData[]): Promise<Account[]> {
    return this.database.write(async () => {
      return Promise.all(
        dataList.map((data) =>
          this.collection.create((account) => {
            account.bankCode = data.bankCode;
            account.bankName = data.bankName;
            account.accountNumber = data.accountNumber;
            account.accountType = data.accountType;
            account.balance = data.balance ?? 0;
            account.isActive = data.isActive ?? true;
          })
        )
      );
    });
  }

  async update(id: string, data: UpdateAccountData): Promise<Account | null> {
    const account = await this.findById(id);
    if (!account) {
      return null;
    }

    await this.database.write(async () => {
      await account.update((a) => {
        if (data.bankCode !== undefined) {
          a.bankCode = data.bankCode;
        }
        if (data.bankName !== undefined) {
          a.bankName = data.bankName;
        }
        if (data.accountNumber !== undefined) {
          a.accountNumber = data.accountNumber;
        }
        if (data.accountType !== undefined) {
          a.accountType = data.accountType;
        }
        if (data.balance !== undefined) {
          a.balance = data.balance;
        }
        if (data.isActive !== undefined) {
          a.isActive = data.isActive;
        }
        if (data.lastSyncedAt !== undefined) {
          a.lastSyncedAt = data.lastSyncedAt;
        }
      });
    });

    return account;
  }

  async updateBalance(id: string, newBalance: number): Promise<Account | null> {
    return this.update(id, { balance: newBalance });
  }

  async updateLastSynced(id: string): Promise<Account | null> {
    return this.update(id, { lastSyncedAt: Date.now() });
  }

  async deactivate(id: string): Promise<Account | null> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<Account | null> {
    return this.update(id, { isActive: true });
  }

  async delete(id: string): Promise<boolean> {
    const account = await this.findById(id);
    if (!account) {
      return false;
    }

    await this.database.write(async () => {
      await account.markAsDeleted();
    });

    return true;
  }

  async getSummary(): Promise<AccountSummary> {
    const accounts = await this.findAll();

    const byBank: Record<BankCode, number> = {
      bancolombia: 0,
      davivienda: 0,
      bbva: 0,
      nequi: 0,
      daviplata: 0,
      bancoomeva: 0,
    };

    let totalBalance = 0;
    let activeCount = 0;

    for (const account of accounts) {
      totalBalance += account.balance;
      if (account.isActive) {
        activeCount++;
      }
      byBank[account.bankCode] = (byBank[account.bankCode] ?? 0) + account.balance;
    }

    return {
      totalBalance,
      accountCount: accounts.length,
      activeCount,
      byBank,
    };
  }

  async getTotalBalance(): Promise<number> {
    const accounts = await this.findActive();
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  async count(): Promise<number> {
    return this.collection.query().fetchCount();
  }

  async countActive(): Promise<number> {
    return this.collection.query(Q.where('is_active', true)).fetchCount();
  }

  async countByBankCode(bankCode: BankCode): Promise<number> {
    return this.collection.query(Q.where('bank_code', bankCode)).fetchCount();
  }

  async exists(id: string): Promise<boolean> {
    const account = await this.findById(id);
    return account !== null;
  }

  async existsByAccountNumber(accountNumber: string): Promise<boolean> {
    const count = await this.collection
      .query(Q.where('account_number', accountNumber))
      .fetchCount();
    return count > 0;
  }
}
