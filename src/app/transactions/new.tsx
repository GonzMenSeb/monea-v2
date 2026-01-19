import { useCallback } from 'react';

import { ScrollView, Pressable, Alert } from 'react-native';

import { useRouter } from 'expo-router';
import { styled, Text, XStack } from 'tamagui';

import { TransactionForm, useTransactionForm, useCreateTransaction } from '@/features/transactions';
import { Screen } from '@/shared/components/layout';
import { Heading, Body } from '@/shared/components/ui';
import { useHaptics } from '@/shared/hooks/useHaptics';
import { colors } from '@/shared/theme';

const Header = styled(XStack, {
  name: 'NewTransactionHeader',
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

export default function NewTransactionScreen(): React.ReactElement {
  const router = useRouter();
  const { success } = useHaptics();
  const createMutation = useCreateTransaction();
  const { formData, errors, setField, setAmount, validate, getCreateData } = useTransactionForm();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(async () => {
    const data = getCreateData();
    if (!data) {
      return;
    }

    try {
      await createMutation.mutateAsync(data);
      success();
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create transaction');
    }
  }, [getCreateData, createMutation, router, success]);

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

        <Heading level="h3">New Transaction</Heading>

        <XStack flex={1} />
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
          onFieldChange={setField}
          onAmountChange={setAmount}
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isLoading={createMutation.isPending}
        />
      </ScrollView>
    </Screen>
  );
}
