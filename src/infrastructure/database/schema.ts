import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const SCHEMA_VERSION = 2;

export const schema = appSchema({
  version: SCHEMA_VERSION,
  tables: [
    tableSchema({
      name: 'accounts',
      columns: [
        { name: 'bank_code', type: 'string' },
        { name: 'bank_name', type: 'string' },
        { name: 'account_number', type: 'string' },
        { name: 'account_type', type: 'string' },
        { name: 'balance', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'account_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'balance_after', type: 'number', isOptional: true },
        { name: 'merchant', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'reference', type: 'string', isOptional: true },
        { name: 'sms_id', type: 'string', isOptional: true },
        { name: 'transaction_date', type: 'number' },
        { name: 'raw_sms', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'is_system', type: 'boolean' },
        { name: 'is_income', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sms_messages',
      columns: [
        { name: 'address', type: 'string', isIndexed: true },
        { name: 'body', type: 'string' },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'is_processed', type: 'boolean' },
        { name: 'processing_error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
