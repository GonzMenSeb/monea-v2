import { useCallback, useMemo } from 'react';

import { ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import {
  TransactionForm,
  useTransactionForm,
  useTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/features/transactions';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Button } from '@/shared/components/ui';
import { useHaptics } from '@/shared/hooks/useHaptics';
import { colors } from '@/shared/theme';

import type { TransactionFormData } from '@/features/transactions';

const Header = styled(XStack, {
  name: 'EditTransactionHeader',
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

export default function EditTransactionScreen(): React.ReactElement {
  const router = useRouter();
  const { success } = useHaptics();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id ?? null);
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const initialData = useMemo((): Partial<TransactionFormData> | undefined => {
    if (!transaction) {
      return undefined;
    }
    return {
      accountId: transaction.accountId,
      type: transaction.type,
      amount: transaction.amount.toString(),
      transactionDate: transaction.transactionDate,
      categoryId: transaction.categoryId ?? undefined,
      merchant: transaction.merchant ?? '',
      description: transaction.description ?? '',
    };
  }, [transaction]);

  const { formData, errors, setField, setAmount, validate } = useTransactionForm({
    initialData,
  });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(async () => {
    if (!id || !validate()) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          categoryId: formData.categoryId || undefined,
          merchant: formData.merchant?.trim() || undefined,
          description: formData.description?.trim() || undefined,
        },
      });
      success();
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update transaction');
    }
  }, [id, validate, updateMutation, formData, router, success]);

  const handleDelete = useCallback(() => {
    if (!id) {
      return;
    }

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
              success();
              router.back();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete transaction'
              );
            }
          },
        },
      ]
    );
  }, [id, deleteMutation, router, success]);

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

  if (!transaction) {
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
          <Body color="$textSecondary">Transaction not found</Body>
        </LoadingContainer>
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

        <Heading level="h3">Edit Transaction</Heading>

        <Stack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <TransactionForm
          formData={formData}
          errors={errors}
          isEditing
          onFieldChange={setField}
          onAmountChange={setAmount}
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
            Delete Transaction
          </Button>
        </DeleteContainer>
      </ScrollView>
    </Screen>
  );
}
