import { Model, associations, type Query } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

import type { BankCode } from './Account';
import type Transaction from './Transaction';

export default class StatementImport extends Model {
  static table = 'statement_imports';

  static associations = associations([
    'transactions',
    { type: 'has_many', foreignKey: 'statement_import_id' },
  ]);

  @field('file_name') fileName!: string;
  @field('file_hash') fileHash!: string;
  @field('bank_code') bankCode!: BankCode;
  @date('statement_period_start') statementPeriodStart!: Date;
  @date('statement_period_end') statementPeriodEnd!: Date;
  @field('transactions_imported') transactionsImported!: number;
  @date('imported_at') importedAt!: Date;
  @readonly @date('created_at') createdAt!: Date;

  @children('transactions') transactions!: Query<Transaction>;
}
