import { useCallback, useMemo } from 'react';

import { ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import {
  CategoryForm,
  useCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/features/categories';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { CategoryFormData } from '@/features/categories';

const Header = styled(XStack, {
  name: 'EditCategoryHeader',
  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$2',
  alignItems: 'center',
});

const BackButton = styled(XStack, {
  name: 'BackButton',
  alignItems: 'center',
  gap: '$1',
  flex: 1,
});

const LoadingContainer = styled(YStack, {
  name: 'LoadingContainer',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
});

const DeleteContainer = styled(YStack, {
  name: 'DeleteContainer',
  padding: '$4',
  gap: '$2',
});

const SystemNotice = styled(YStack, {
  name: 'SystemNotice',
  backgroundColor: '$backgroundSurface',
  padding: '$4',
  margin: '$4',
  borderRadius: '$4',
  alignItems: 'center',
  gap: '$2',
});

export default function EditCategoryScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: category, isLoading } = useCategory(id ?? null);
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const initialData = useMemo(
    () =>
      category
        ? {
            name: category.name,
            icon: category.icon,
            color: category.color,
            isIncome: category.isIncome,
          }
        : undefined,
    [category]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(
    async (data: CategoryFormData) => {
      if (!id) {
        return;
      }

      try {
        await updateMutation.mutateAsync({
          id,
          data: {
            name: data.name,
            icon: data.icon,
            color: data.color,
          },
        });
        router.back();
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update category');
      }
    },
    [id, updateMutation, router]
  );

  const handleDelete = useCallback(() => {
    if (!id || !category) {
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              router.back();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete category'
              );
            }
          },
        },
      ]
    );
  }, [id, category, deleteMutation, router]);

  if (isLoading) {
    return (
      <Screen
        variant="fixed"
        backgroundColor={colors.background.base}
        edges={['top', 'left', 'right']}
      >
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </LoadingContainer>
      </Screen>
    );
  }

  if (!category) {
    return (
      <Screen
        variant="fixed"
        backgroundColor={colors.background.base}
        edges={['top', 'left', 'right']}
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
        </Header>
        <LoadingContainer>
          <Body color="$textSecondary">Category not found</Body>
        </LoadingContainer>
      </Screen>
    );
  }

  if (category.isSystem) {
    return (
      <Screen
        variant="fixed"
        backgroundColor={colors.background.base}
        edges={['top', 'left', 'right']}
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

          <Heading level="h3">{category.name}</Heading>

          <Stack flex={1} />
        </Header>

        <SystemNotice>
          <Text fontSize="$6">🔒</Text>
          <Body color="$textPrimary" textAlign="center">
            System Category
          </Body>
          <Body color="$textSecondary" textAlign="center" fontSize="$2">
            This is a predefined category and cannot be modified or deleted.
          </Body>
        </SystemNotice>
      </Screen>
    );
  }

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding
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

        <Heading level="h3">Edit Category</Heading>

        <Stack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CategoryForm
          initialData={initialData}
          isEditing
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isLoading={updateMutation.isPending}
        />

        <DeleteContainer>
          <Button
            variant="danger"
            onPress={handleDelete}
            loading={deleteMutation.isPending}
            fullWidth
          >
            Delete Category
          </Button>
        </DeleteContainer>
      </ScrollView>
    </Screen>
  );
}
