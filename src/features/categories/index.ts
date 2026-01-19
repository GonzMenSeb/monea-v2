export { CategoryItem, CategoryList, CategoryForm, IconPicker, ColorPicker } from './components';
export type { CategoryItemProps } from './components';

export {
  useCategories,
  useCategory,
  useCategoriesByType,
  useSystemCategories,
  useCustomCategories,
  useCategoryTransactionCount,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSelectedCategory,
  useFilteredCategories,
  CATEGORY_QUERY_KEYS,
} from './hooks';

export { useCategoryStore } from './store';
export type { CategoryStore } from './store';

export { CATEGORY_COLORS, CATEGORY_ICONS, getCategoryEmoji, getCategoryLabel } from './types';
export type { CategoryFormData, CategoryWithCount, CategoryColor } from './types';
