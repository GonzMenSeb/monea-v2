# Generate WatermelonDB Model

Create a WatermelonDB model with schema and repository.

## Arguments
- `$ARGUMENTS` - Model name (e.g., "Transaction", "Account", "BankPattern")

## Instructions

Parse arguments to extract model name and create database model files.

### 1. Model File: `src/infrastructure/database/models/{ModelName}.ts`

```typescript
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export class {ModelName} extends Model {
  static table = '{table_name}';

  static associations = {
    // Define associations if needed
  };

  @field('field_name') fieldName!: string;
  @field('amount') amount!: number;
  @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
```

### 2. Schema Addition: `src/infrastructure/database/schema.ts`

Add to tableSchemas:
```typescript
tableSchema({
  name: '{table_name}',
  columns: [
    { name: 'field_name', type: 'string' },
    { name: 'amount', type: 'number' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
}),
```

### 3. Repository File: `src/infrastructure/database/repositories/{modelName}Repository.ts`

```typescript
import { Q } from '@nozbe/watermelondb';

import { database } from '../database';
import { {ModelName} } from '../models/{ModelName}';

import type { {ModelName}Entity } from '@/features/{feature}/types';

class {ModelName}RepositoryImpl {
  private get collection() {
    return database.get<{ModelName}>('{table_name}');
  }

  async findAll(): Promise<{ModelName}[]> {
    return this.collection.query().fetch();
  }

  async findById(id: string): Promise<{ModelName} | null> {
    try {
      return await this.collection.find(id);
    } catch {
      return null;
    }
  }

  async create(data: Omit<{ModelName}Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ModelName}> {
    return database.write(async () => {
      return this.collection.create((record) => {
        Object.assign(record, data);
      });
    });
  }

  async update(id: string, data: Partial<{ModelName}Entity>): Promise<{ModelName}> {
    return database.write(async () => {
      const record = await this.collection.find(id);
      return record.update((r) => {
        Object.assign(r, data);
      });
    });
  }

  async delete(id: string): Promise<void> {
    return database.write(async () => {
      const record = await this.collection.find(id);
      await record.markAsDeleted();
    });
  }
}

export const {modelName}Repository = new {ModelName}RepositoryImpl();
```

### 4. Update Model Index: `src/infrastructure/database/models/index.ts`

Add: `export { {ModelName} } from './{ModelName}';`

### 5. Update Repository Index: `src/infrastructure/database/repositories/index.ts`

Add: `export { {modelName}Repository } from './{modelName}Repository';`

## WatermelonDB Decorators Reference
| Decorator | Use Case |
|-----------|----------|
| `@field('column')` | Basic field mapping |
| `@text('column')` | Text with sanitization |
| `@date('column')` | Date field (stored as number) |
| `@readonly` | Prevents manual updates |
| `@relation('table', 'fk_column')` | Belongs-to relation |
| `@children('table')` | Has-many relation |
| `@json('column', sanitizer)` | JSON field |

## Migration (if updating existing schema)

Create migration file: `src/infrastructure/database/migrations/{version}_{description}.ts`

```typescript
import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: {nextVersion},
      steps: [
        addColumns({
          table: '{table_name}',
          columns: [
            { name: 'new_column', type: 'string' },
          ],
        }),
      ],
    },
  ],
});
```
