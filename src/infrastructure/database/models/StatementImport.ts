import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

import type { BankCode } from './Account';

export default class StatementImport extends Model {
  static table = 'statement_imports';

  @field('file_name') fileName!: string;
  @field('file_hash') fileHash!: string;
  @field('bank_code') bankCode!: BankCode;
  @date('statement_period_start') statementPeriodStart!: Date;
  @date('statement_period_end') statementPeriodEnd!: Date;
  @field('transactions_imported') transactionsImported!: number;
  @date('imported_at') importedAt!: Date;
  @readonly @date('created_at') createdAt!: Date;
}
