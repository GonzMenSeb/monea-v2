import { Q } from '@nozbe/watermelondb';

import type Transaction from '../models/Transaction';
import type { TransactionType } from '../models/Transaction';
import type { Database, Query } from '@nozbe/watermelondb';

export interface CreateTransactionData {
  accountId: string;
  type: TransactionType;
  amount: number;
  transactionDate: Date;
  categoryId?: string;
  balanceAfter?: number;
  merchant?: string;
  description?: string;
  reference?: string;
  smsId?: string;
  rawSms?: string;
}

export interface UpdateTransactionData {
  categoryId?: string;
  merchant?: string;
  description?: string;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  merchant?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
}

export class TransactionRepository {
  private collection;

  constructor(private database: Database) {
    this.collection = database.get<Transaction>('transactions');
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      return await this.collection.find(id);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<Transaction[]> {
    return this.collection.query().fetch();
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.collection.query(Q.where('account_id', accountId)).fetch();
  }

  async findByCategoryId(categoryId: string): Promise<Transaction[]> {
    return this.collection.query(Q.where('category_id', categoryId)).fetch();
  }

  async findBySmsId(smsId: string): Promise<Transaction | null> {
    const results = await this.collection.query(Q.where('sms_id', smsId)).fetch();
    return results[0] ?? null;
  }

  async findByFilters(filters: TransactionFilters): Promise<Transaction[]> {
    const conditions: Q.Clause[] = [];

    if (filters.accountId) {
      conditions.push(Q.where('account_id', filters.accountId));
    }
    if (filters.categoryId) {
      conditions.push(Q.where('category_id', filters.categoryId));
    }
    if (filters.type) {
      conditions.push(Q.where('type', filters.type));
    }
    if (filters.startDate) {
      conditions.push(Q.where('transaction_date', Q.gte(filters.startDate.getTime())));
    }
    if (filters.endDate) {
      conditions.push(Q.where('transaction_date', Q.lte(filters.endDate.getTime())));
    }
    if (filters.minAmount !== undefined) {
      conditions.push(Q.where('amount', Q.gte(filters.minAmount)));
    }
    if (filters.maxAmount !== undefined) {
      conditions.push(Q.where('amount', Q.lte(filters.maxAmount)));
    }
    if (filters.merchant) {
      conditions.push(Q.where('merchant', Q.like(`%${Q.sanitizeLikeString(filters.merchant)}%`)));
    }

    return this.collection.query(...conditions).fetch();
  }

  async findRecentByAccount(accountId: string, limit: number = 10): Promise<Transaction[]> {
    return this.collection
      .query(Q.where('account_id', accountId), Q.sortBy('transaction_date', Q.desc), Q.take(limit))
      .fetch();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.collection
      .query(
        Q.where('transaction_date', Q.gte(startDate.getTime())),
        Q.where('transaction_date', Q.lte(endDate.getTime())),
        Q.sortBy('transaction_date', Q.desc)
      )
      .fetch();
  }

  observeByAccountId(accountId: string): Query<Transaction> {
    return this.collection.query(
      Q.where('account_id', accountId),
      Q.sortBy('transaction_date', Q.desc)
    );
  }

  observeRecent(limit: number = 20): Query<Transaction> {
    return this.collection.query(Q.sortBy('transaction_date', Q.desc), Q.take(limit));
  }

  async create(data: CreateTransactionData): Promise<Transaction> {
    return this.database.write(async () => {
      return this.collection.create((transaction) => {
        transaction.accountId = data.accountId;
        transaction.type = data.type;
        transaction.amount = data.amount;
        transaction.transactionDate = data.transactionDate;
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

  async createBatch(dataList: CreateTransactionData[]): Promise<Transaction[]> {
    return this.database.write(async () => {
      return Promise.all(
        dataList.map((data) =>
          this.collection.create((transaction) => {
            transaction.accountId = data.accountId;
            transaction.type = data.type;
            transaction.amount = data.amount;
            transaction.transactionDate = data.transactionDate;
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
          })
        )
      );
    });
  }

  async update(id: string, data: UpdateTransactionData): Promise<Transaction | null> {
    const transaction = await this.findById(id);
    if (!transaction) {
      return null;
    }

    await this.database.write(async () => {
      await transaction.update((t) => {
        if (data.categoryId !== undefined) {
          t.categoryId = data.categoryId;
        }
        if (data.merchant !== undefined) {
          t.merchant = data.merchant;
        }
        if (data.description !== undefined) {
          t.description = data.description;
        }
      });
    });

    return transaction;
  }

  async delete(id: string): Promise<boolean> {
    const transaction = await this.findById(id);
    if (!transaction) {
      return false;
    }

    await this.database.write(async () => {
      await transaction.markAsDeleted();
    });

    return true;
  }

  async deleteByAccountId(accountId: string): Promise<number> {
    const transactions = await this.findByAccountId(accountId);
    if (transactions.length === 0) {
      return 0;
    }

    await this.database.write(async () => {
      await Promise.all(transactions.map((t) => t.markAsDeleted()));
    });

    return transactions.length;
  }

  async getSummaryByDateRange(startDate: Date, endDate: Date): Promise<TransactionSummary> {
    const transactions = await this.findByDateRange(startDate, endDate);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === 'income' || t.type === 'transfer_in') {
        totalIncome += t.amount;
      } else if (t.type === 'expense' || t.type === 'transfer_out') {
        totalExpense += t.amount;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    };
  }

  async getSummaryByAccountId(accountId: string): Promise<TransactionSummary> {
    const transactions = await this.findByAccountId(accountId);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === 'income' || t.type === 'transfer_in') {
        totalIncome += t.amount;
      } else if (t.type === 'expense' || t.type === 'transfer_out') {
        totalExpense += t.amount;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    };
  }

  async count(): Promise<number> {
    return this.collection.query().fetchCount();
  }

  async countByAccountId(accountId: string): Promise<number> {
    return this.collection.query(Q.where('account_id', accountId)).fetchCount();
  }

  async exists(id: string): Promise<boolean> {
    const transaction = await this.findById(id);
    return transaction !== null;
  }

  async existsBySmsId(smsId: string): Promise<boolean> {
    const count = await this.collection.query(Q.where('sms_id', smsId)).fetchCount();
    return count > 0;
  }

  async getCalculatedBalanceByAccountId(accountId: string): Promise<number> {
    const transactions = await this.findByAccountId(accountId);
    let balance = 0;

    for (const t of transactions) {
      if (t.type === 'income' || t.type === 'transfer_in') {
        balance += t.amount;
      } else if (t.type === 'expense' || t.type === 'transfer_out') {
        balance -= t.amount;
      }
    }

    return balance;
  }

  async getLatestBalanceAfterByAccountId(accountId: string): Promise<number | null> {
    const transactions = await this.collection
      .query(
        Q.where('account_id', accountId),
        Q.where('balance_after', Q.notEq(null)),
        Q.sortBy('transaction_date', Q.desc),
        Q.take(1)
      )
      .fetch();

    const transaction = transactions[0];
    if (!transaction) {
      return null;
    }

    return transaction.balanceAfter ?? null;
  }

  async getBalancesByAccountIds(accountIds: string[]): Promise<Map<string, number>> {
    const balances = new Map<string, number>();

    for (const accountId of accountIds) {
      const latestBalance = await this.getLatestBalanceAfterByAccountId(accountId);
      if (latestBalance !== null) {
        balances.set(accountId, latestBalance);
      } else {
        const calculatedBalance = await this.getCalculatedBalanceByAccountId(accountId);
        balances.set(accountId, calculatedBalance);
      }
    }

    return balances;
  }
}
