import { useCallback, useMemo } from 'react';

import { Pressable } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack } from 'tamagui';

import { useCategories, CategoryList, CATEGORY_QUERY_KEYS } from '@/features/categories';
import { Screen } from '@/shared/components/layout';
import { Heading, Body } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

const Header = styled(XStack, {
  name: 'CategoriesHeader',
  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$2',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const BackButton = styled(XStack, {
  name: 'BackButton',
  alignItems: 'center',
  gap: '$1',
});

const AddButton = styled(Stack, {
  name: 'AddButton',
  backgroundColor: '$accentPrimary',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$3',
});

export default function CategoriesScreen(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading, isRefetching } = useCategories();

  const transactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    return counts;
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleAddCategory = useCallback(() => {
    router.push('/settings/category/new');
  }, [router]);

  const handleCategoryPress = useCallback(
    (id: string) => {
      router.push(`/settings/category/${id}`);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
  }, [queryClient]);

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <Header>
        <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          {({ pressed }) => (
            <BackButton opacity={pressed ? 0.7 : 1}>
              <Text color="$accentPrimary" fontSize="$5">
                ‹
              </Text>
              <Body color="$accentPrimary">Back</Body>
            </BackButton>
          )}
        </Pressable>

        <Heading level="h3">Categories</Heading>

        <Pressable
          onPress={handleAddCategory}
          accessibilityRole="button"
          accessibilityLabel="Add category"
        >
          {({ pressed }) => (
            <AddButton opacity={pressed ? 0.7 : 1}>
              <Text color="$textInverse" fontWeight="600" fontSize="$2">
                + Add
              </Text>
            </AddButton>
          )}
        </Pressable>
      </Header>

      <CategoryList
        categories={categories}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        onCategoryPress={handleCategoryPress}
        transactionCounts={transactionCounts}
      />
    </Screen>
  );
}
