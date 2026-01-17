import { Model, associations, type Query } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

import type Transaction from './Transaction';

export type CategoryIcon =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'utilities'
  | 'home'
  | 'travel'
  | 'salary'
  | 'investment'
  | 'transfer'
  | 'other';

export default class Category extends Model {
  static table = 'categories';

  static associations = associations([
    'transactions',
    { type: 'has_many', foreignKey: 'category_id' },
  ]);

  @field('name') name!: string;
  @field('icon') icon!: CategoryIcon;
  @field('color') color!: string;
  @field('is_system') isSystem!: boolean;
  @field('is_income') isIncome!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('transactions') transactions!: Query<Transaction>;
}
