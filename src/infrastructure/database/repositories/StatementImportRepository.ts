import { Q } from '@nozbe/watermelondb';

import type StatementImport from '../models/StatementImport';
import type { BankCode } from '../models/Account';
import type { Database, Query } from '@nozbe/watermelondb';

export interface CreateStatementImportData {
  fileName: string;
  fileHash: string;
  bankCode: BankCode;
  statementPeriodStart: Date;
  statementPeriodEnd: Date;
  transactionsImported: number;
  importedAt?: Date;
}

export interface StatementImportFilters {
  bankCode?: BankCode;
  startDate?: Date;
  endDate?: Date;
  minTransactions?: number;
}

export class StatementImportRepository {
  private collection;

  constructor(private database: Database) {
    this.collection = database.get<StatementImport>('statement_imports');
  }

  async findById(id: string): Promise<StatementImport | null> {
    try {
      return await this.collection.find(id);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<StatementImport[]> {
    return this.collection
      .query(Q.sortBy('imported_at', Q.desc))
      .fetch();
  }

  async findByFileHash(fileHash: string): Promise<StatementImport | null> {
    const results = await this.collection
      .query(Q.where('file_hash', fileHash))
      .fetch();
    return results[0] ?? null;
  }

  async findByPeriod(startDate: Date, endDate: Date): Promise<StatementImport[]> {
    return this.collection
      .query(
        Q.or(
          Q.and(
            Q.where('statement_period_start', Q.lte(endDate.getTime())),
            Q.where('statement_period_end', Q.gte(startDate.getTime()))
          )
        ),
        Q.sortBy('statement_period_start', Q.desc)
      )
      .fetch();
  }

  async findByBankCode(bankCode: BankCode): Promise<StatementImport[]> {
    return this.collection
      .query(
        Q.where('bank_code', bankCode),
        Q.sortBy('statement_period_start', Q.desc)
      )
      .fetch();
  }

  async findByFilters(filters: StatementImportFilters): Promise<StatementImport[]> {
    const conditions: Q.Clause[] = [];

    if (filters.bankCode) {
      conditions.push(Q.where('bank_code', filters.bankCode));
    }
    if (filters.startDate) {
      conditions.push(Q.where('statement_period_start', Q.gte(filters.startDate.getTime())));
    }
    if (filters.endDate) {
      conditions.push(Q.where('statement_period_end', Q.lte(filters.endDate.getTime())));
    }
    if (filters.minTransactions !== undefined) {
      conditions.push(Q.where('transactions_imported', Q.gte(filters.minTransactions)));
    }

    conditions.push(Q.sortBy('imported_at', Q.desc));

    return this.collection.query(...conditions).fetch();
  }

  observeAll(): Query<StatementImport> {
    return this.collection.query(Q.sortBy('imported_at', Q.desc));
  }

  async create(data: CreateStatementImportData): Promise<StatementImport> {
    return this.database.write(async () => {
      return this.collection.create((statementImport) => {
        statementImport.fileName = data.fileName;
        statementImport.fileHash = data.fileHash;
        statementImport.bankCode = data.bankCode;
        statementImport.statementPeriodStart = data.statementPeriodStart;
        statementImport.statementPeriodEnd = data.statementPeriodEnd;
        statementImport.transactionsImported = data.transactionsImported;
        statementImport.importedAt = data.importedAt ?? new Date();
      });
    });
  }

  async delete(id: string): Promise<boolean> {
    const statementImport = await this.findById(id);
    if (!statementImport) {
      return false;
    }

    await this.database.write(async () => {
      await statementImport.markAsDeleted();
    });

    return true;
  }

  async count(): Promise<number> {
    return this.collection.query().fetchCount();
  }

  async countByBankCode(bankCode: BankCode): Promise<number> {
    return this.collection.query(Q.where('bank_code', bankCode)).fetchCount();
  }

  async exists(id: string): Promise<boolean> {
    const statementImport = await this.findById(id);
    return statementImport !== null;
  }

  async existsByFileHash(fileHash: string): Promise<boolean> {
    const count = await this.collection
      .query(Q.where('file_hash', fileHash))
      .fetchCount();
    return count > 0;
  }

  async getTotalTransactionsImported(): Promise<number> {
    const imports = await this.findAll();
    return imports.reduce((sum, i) => sum + i.transactionsImported, 0);
  }

  async getLatestByBankCode(bankCode: BankCode): Promise<StatementImport | null> {
    const results = await this.collection
      .query(
        Q.where('bank_code', bankCode),
        Q.sortBy('statement_period_end', Q.desc),
        Q.take(1)
      )
      .fetch();
    return results[0] ?? null;
  }
}
