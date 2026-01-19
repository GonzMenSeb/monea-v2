import { useCallback } from 'react';

import { ScrollView, Pressable, Alert } from 'react-native';

import { useRouter } from 'expo-router';
import { styled, Text, XStack } from 'tamagui';

import { CategoryForm, useCreateCategory } from '@/features/categories';
import { Screen } from '@/shared/components/layout';
import { Heading, Body } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { CategoryFormData } from '@/features/categories';

const Header = styled(XStack, {
  name: 'NewCategoryHeader',
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

export default function NewCategoryScreen(): React.ReactElement {
  const router = useRouter();
  const createMutation = useCreateCategory();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(
    async (data: CategoryFormData) => {
      try {
        await createMutation.mutateAsync({
          name: data.name,
          icon: data.icon,
          color: data.color,
          isIncome: data.isIncome,
          isSystem: false,
        });
        router.back();
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create category');
      }
    },
    [createMutation, router]
  );

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

        <Heading level="h3">New Category</Heading>

        <XStack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CategoryForm
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isLoading={createMutation.isPending}
        />
      </ScrollView>
    </Screen>
  );
}
