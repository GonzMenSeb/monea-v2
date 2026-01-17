import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

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
  ],
});
