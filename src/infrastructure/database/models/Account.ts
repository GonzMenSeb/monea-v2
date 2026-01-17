import { Model, associations } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

import type Transaction from './Transaction';

export default class Account extends Model {
  static table = 'accounts';

  static associations = associations([
    'transactions',
    { type: 'has_many', foreignKey: 'account_id' },
  ]);

  @field('bank_code') bankCode!: string;
  @field('bank_name') bankName!: string;
  @field('account_number') accountNumber!: string;
  @field('account_type') accountType!: string;
  @field('balance') balance!: number;
  @field('last_synced_at') lastSyncedAt?: number;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('transactions') transactions!: Transaction[];
}
