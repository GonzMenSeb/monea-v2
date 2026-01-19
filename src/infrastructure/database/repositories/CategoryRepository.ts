import { Q } from '@nozbe/watermelondb';

import type Category from '../models/Category';
import type { CategoryIcon } from '../models/Category';
import type { Database, Query } from '@nozbe/watermelondb';

export interface CreateCategoryData {
  name: string;
  icon: CategoryIcon;
  color: string;
  isIncome: boolean;
  isSystem?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: CategoryIcon;
  color?: string;
}

export interface CategoryFilters {
  isIncome?: boolean;
  isSystem?: boolean;
}

export class CategoryRepository {
  private collection;

  constructor(private database: Database) {
    this.collection = database.get<Category>('categories');
  }

  async findById(id: string): Promise<Category | null> {
    try {
      return await this.collection.find(id);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<Category[]> {
    return this.collection.query(Q.sortBy('name', Q.asc)).fetch();
  }

  async findByType(isIncome: boolean): Promise<Category[]> {
    return this.collection.query(Q.where('is_income', isIncome), Q.sortBy('name', Q.asc)).fetch();
  }

  async findSystemCategories(): Promise<Category[]> {
    return this.collection.query(Q.where('is_system', true), Q.sortBy('name', Q.asc)).fetch();
  }

  async findCustomCategories(): Promise<Category[]> {
    return this.collection.query(Q.where('is_system', false), Q.sortBy('name', Q.asc)).fetch();
  }

  async findByFilters(filters: CategoryFilters): Promise<Category[]> {
    const conditions: Q.Clause[] = [];

    if (filters.isIncome !== undefined) {
      conditions.push(Q.where('is_income', filters.isIncome));
    }
    if (filters.isSystem !== undefined) {
      conditions.push(Q.where('is_system', filters.isSystem));
    }

    conditions.push(Q.sortBy('name', Q.asc));
    return this.collection.query(...conditions).fetch();
  }

  observeAll(): Query<Category> {
    return this.collection.query(Q.sortBy('name', Q.asc));
  }

  observeByType(isIncome: boolean): Query<Category> {
    return this.collection.query(Q.where('is_income', isIncome), Q.sortBy('name', Q.asc));
  }

  async create(data: CreateCategoryData): Promise<Category> {
    return this.database.write(async () => {
      return this.collection.create((category) => {
        category.name = data.name;
        category.icon = data.icon;
        category.color = data.color;
        category.isIncome = data.isIncome;
        category.isSystem = data.isSystem ?? false;
      });
    });
  }

  async createBatch(dataList: CreateCategoryData[]): Promise<Category[]> {
    return this.database.write(async () => {
      return Promise.all(
        dataList.map((data) =>
          this.collection.create((category) => {
            category.name = data.name;
            category.icon = data.icon;
            category.color = data.color;
            category.isIncome = data.isIncome;
            category.isSystem = data.isSystem ?? false;
          })
        )
      );
    });
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category | null> {
    const category = await this.findById(id);
    if (!category) {
      return null;
    }

    if (category.isSystem) {
      throw new Error('Cannot modify system categories');
    }

    await this.database.write(async () => {
      await category.update((c) => {
        if (data.name !== undefined) {
          c.name = data.name;
        }
        if (data.icon !== undefined) {
          c.icon = data.icon;
        }
        if (data.color !== undefined) {
          c.color = data.color;
        }
      });
    });

    return category;
  }

  async delete(id: string): Promise<boolean> {
    const category = await this.findById(id);
    if (!category) {
      return false;
    }

    if (category.isSystem) {
      throw new Error('Cannot delete system categories');
    }

    await this.database.write(async () => {
      await category.markAsDeleted();
    });

    return true;
  }

  async count(): Promise<number> {
    return this.collection.query().fetchCount();
  }

  async countByType(isIncome: boolean): Promise<number> {
    return this.collection.query(Q.where('is_income', isIncome)).fetchCount();
  }

  async exists(id: string): Promise<boolean> {
    const category = await this.findById(id);
    return category !== null;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.collection
      .query(Q.where('name', Q.like(`${Q.sanitizeLikeString(name)}`)))
      .fetchCount();
    return count > 0;
  }

  async getTransactionCount(categoryId: string): Promise<number> {
    const category = await this.findById(categoryId);
    if (!category) {
      return 0;
    }
    return category.transactions.fetchCount();
  }
}
