import type { CategoryIcon } from '@/infrastructure/database';

export interface CategoryFormData {
  name: string;
  icon: CategoryIcon;
  color: string;
  isIncome: boolean;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  icon: CategoryIcon;
  color: string;
  isSystem: boolean;
  isIncome: boolean;
  transactionCount: number;
}

export const CATEGORY_COLORS = [
  '#00D4AA',
  '#7B61FF',
  '#FFB800',
  '#FF4757',
  '#3B82F6',
  '#EC4899',
  '#F97316',
  '#84CC16',
  '#06B6D4',
  '#8B5CF6',
  '#EF4444',
  '#10B981',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const CATEGORY_ICONS: { value: CategoryIcon; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍔' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'health', label: 'Health', emoji: '💊' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'utilities', label: 'Utilities', emoji: '💡' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'salary', label: 'Salary', emoji: '💵' },
  { value: 'investment', label: 'Investment', emoji: '📈' },
  { value: 'transfer', label: 'Transfer', emoji: '🔄' },
  { value: 'other', label: 'Other', emoji: '📦' },
];

export function getCategoryEmoji(icon: CategoryIcon): string {
  const found = CATEGORY_ICONS.find((i) => i.value === icon);
  return found?.emoji ?? '📦';
}

export function getCategoryLabel(icon: CategoryIcon): string {
  const found = CATEGORY_ICONS.find((i) => i.value === icon);
  return found?.label ?? 'Other';
}
