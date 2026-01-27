import { Model, associations, type Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import type Account from './Account';
import type Category from './Category';
import type StatementImport from './StatementImport';

export type TransactionType = 'income' | 'expense' | 'transfer_in' | 'transfer_out';

export default class Transaction extends Model {
  static table = 'transactions';

  static associations = associations(
    ['accounts', { type: 'belongs_to', key: 'account_id' }],
    ['categories', { type: 'belongs_to', key: 'category_id' }],
    ['statement_imports', { type: 'belongs_to', key: 'statement_import_id' }]
  );

  @field('account_id') accountId!: string;
  @field('category_id') categoryId?: string;
  @field('type') type!: TransactionType;
  @field('amount') amount!: number;
  @field('balance_after') balanceAfter?: number;
  @field('merchant') merchant?: string;
  @field('description') description?: string;
  @field('reference') reference?: string;
  @field('sms_id') smsId?: string;
  @field('statement_import_id') statementImportId?: string;
  @date('transaction_date') transactionDate!: Date;
  @field('raw_sms') rawSms?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('accounts', 'account_id') account!: Relation<Account>;
  @relation('categories', 'category_id') category!: Relation<Category>;
  @relation('statement_imports', 'statement_import_id')
  statementImport!: Relation<StatementImport>;
}
