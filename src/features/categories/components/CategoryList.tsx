import { useCallback, useMemo } from 'react';

import { RefreshControl, SectionList, type SectionListData } from 'react-native';

import { styled, Stack, Text, YStack } from 'tamagui';

import { Body } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import { CategoryItem } from './CategoryItem';

import type Category from '@/infrastructure/database/models/Category';

interface CategorySection {
  title: string;
  data: Category[];
}

interface CategoryListProps {
  categories: Category[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onCategoryPress?: (id: string) => void;
  transactionCounts?: Record<string, number>;
}

const SectionHeader = styled(Stack, {
  name: 'CategorySectionHeader',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  backgroundColor: '$backgroundBase',
});

const SectionTitle = styled(Text, {
  name: 'CategorySectionTitle',
  color: '$textSecondary',
  fontSize: '$1',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

const ItemSeparator = styled(Stack, {
  name: 'CategoryItemSeparator',
  height: 1,
  backgroundColor: '$border',
  marginLeft: 68,
});

const EmptyContainer = styled(YStack, {
  name: 'CategoryEmptyContainer',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$10',
});

export function CategoryList({
  categories,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onCategoryPress,
  transactionCounts = {},
}: CategoryListProps): React.ReactElement {
  const sections = useMemo((): CategorySection[] => {
    const incomeCategories = categories.filter((c) => c.isIncome);
    const expenseCategories = categories.filter((c) => !c.isIncome);

    const result: CategorySection[] = [];

    if (incomeCategories.length > 0) {
      result.push({ title: 'Income', data: incomeCategories });
    }

    if (expenseCategories.length > 0) {
      result.push({ title: 'Expense', data: expenseCategories });
    }

    return result;
  }, [categories]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<Category, CategorySection> }) => (
      <SectionHeader>
        <SectionTitle>{section.title}</SectionTitle>
      </SectionHeader>
    ),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Category }) => (
      <CategoryItem
        id={item.id}
        name={item.name}
        icon={item.icon}
        color={item.color}
        isSystem={item.isSystem}
        isIncome={item.isIncome}
        transactionCount={transactionCounts[item.id]}
        onPress={onCategoryPress}
      />
    ),
    [onCategoryPress, transactionCounts]
  );

  const renderSeparator = useCallback(() => <ItemSeparator />, []);

  const keyExtractor = useCallback((item: Category) => item.id, []);

  const renderEmpty = useCallback(
    () => (
      <EmptyContainer>
        <Text fontSize="$6" marginBottom="$2">
          📂
        </Text>
        <Body color="$textSecondary">No categories yet</Body>
      </EmptyContainer>
    ),
    []
  );

  if (isLoading && categories.length === 0) {
    return (
      <EmptyContainer>
        <Body color="$textSecondary">Loading categories...</Body>
      </EmptyContainer>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ItemSeparatorComponent={renderSeparator}
      ListEmptyComponent={renderEmpty}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        ) : undefined
      }
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
    />
  );
}
