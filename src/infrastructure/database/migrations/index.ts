import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
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
    },
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'statement_imports',
          columns: [
            { name: 'file_name', type: 'string' },
            { name: 'file_hash', type: 'string', isIndexed: true },
            { name: 'bank_code', type: 'string', isIndexed: true },
            { name: 'statement_period_start', type: 'number', isIndexed: true },
            { name: 'statement_period_end', type: 'number', isIndexed: true },
            { name: 'transactions_imported', type: 'number' },
            { name: 'imported_at', type: 'number' },
            { name: 'created_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'transactions',
          columns: [
            { name: 'statement_import_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
  ],
});
