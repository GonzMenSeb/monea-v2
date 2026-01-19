import { useCallback } from 'react';

import { Modal, ScrollView } from 'react-native';

import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type Transaction from '@/infrastructure/database/models/Transaction';
import type { TransactionType } from '@/infrastructure/database/models/Transaction';

interface TransactionDetailProps {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
  bankName?: string;
  accountNumber?: string;
}

const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  { sign: string; color: string; label: string }
> = {
  income: { sign: '+', color: colors.transaction.income, label: 'Income' },
  expense: { sign: '-', color: colors.transaction.expense, label: 'Expense' },
  transfer_in: { sign: '+', color: colors.transaction.transfer, label: 'Transfer In' },
  transfer_out: { sign: '-', color: colors.transaction.transfer, label: 'Transfer Out' },
};

const BANK_COLORS: Record<string, string> = {
  bancolombia: colors.bancolombia.yellow,
  davivienda: colors.davivienda.red,
  bbva: colors.bbva.blue,
  nequi: colors.nequi.pink,
  daviplata: colors.daviplata.orange,
};

const Backdrop = styled(Stack, {
  name: 'Backdrop',
  flex: 1,
  backgroundColor: '$backgroundOverlay',
  justifyContent: 'flex-end',
});

const ModalContent = styled(YStack, {
  name: 'ModalContent',
  backgroundColor: '$backgroundElevated',
  borderTopLeftRadius: '$6',
  borderTopRightRadius: '$6',
  maxHeight: '85%',
});

const Handle = styled(Stack, {
  name: 'Handle',
  width: 48,
  height: 4,
  borderRadius: '$full',
  alignSelf: 'center',
  marginTop: '$3',
  marginBottom: '$2',
});

const HeaderSection = styled(YStack, {
  name: 'HeaderSection',
  paddingHorizontal: '$6',
  paddingTop: '$4',
  paddingBottom: '$6',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
  alignItems: 'center',
});

const TypeLabel = styled(Text, {
  name: 'TypeLabel',
  color: '$textSecondary',
  fontSize: '$4',
  marginBottom: '$1',
});

const AmountText = styled(Text, {
  name: 'AmountText',
  fontFamily: '$mono',
  fontSize: 40,
  fontWeight: '700',
  letterSpacing: -1,
});

const MerchantText = styled(Text, {
  name: 'MerchantText',
  color: '$textPrimary',
  fontSize: '$4',
  fontWeight: '600',
  marginTop: '$3',
});

const DetailRow = styled(XStack, {
  name: 'DetailRow',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  paddingVertical: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
});

const DetailLabel = styled(Text, {
  name: 'DetailLabel',
  color: '$textSecondary',
  fontSize: '$2',
  flexShrink: 0,
  marginRight: '$4',
});

const DetailValue = styled(Text, {
  name: 'DetailValue',
  color: '$textPrimary',
  fontSize: '$2',
  fontWeight: '500',
  textAlign: 'right',
  flex: 1,
});

const FooterSection = styled(Stack, {
  name: 'FooterSection',
  paddingHorizontal: '$6',
  paddingBottom: '$8',
  paddingTop: '$4',
  borderTopWidth: 1,
  borderTopColor: '$border',
});

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function DetailItem({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <DetailRow>
      <DetailLabel>{label}</DetailLabel>
      <DetailValue numberOfLines={2}>{value}</DetailValue>
    </DetailRow>
  );
}

export function TransactionDetail({
  transaction,
  visible,
  onClose,
  formatCurrency,
  bankName,
  accountNumber,
}: TransactionDetailProps): React.ReactElement | null {
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!transaction) {
    return null;
  }

  const typeConfig = TRANSACTION_TYPE_CONFIG[transaction.type];
  const formattedAmount = `${typeConfig.sign}${formatCurrency(transaction.amount)}`;
  const displayTitle = transaction.merchant || transaction.description || typeConfig.label;
  const bankAccentColor =
    bankName && BANK_COLORS[bankName.toLowerCase()]
      ? BANK_COLORS[bankName.toLowerCase()]
      : colors.accent.primary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Backdrop
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel="Close transaction details"
      >
        <ModalContent onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
          <Handle backgroundColor={bankAccentColor} />

          <HeaderSection>
            <TypeLabel>{typeConfig.label}</TypeLabel>
            <AmountText color={typeConfig.color} accessibilityLabel={`Amount: ${formattedAmount}`}>
              {formattedAmount}
            </AmountText>
            <MerchantText>{displayTitle}</MerchantText>
          </HeaderSection>

          <ScrollView style={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
            <YStack paddingVertical="$2">
              <DetailItem label="Date" value={formatDateTime(transaction.transactionDate)} />

              {transaction.description && transaction.merchant && (
                <DetailItem label="Description" value={transaction.description} />
              )}

              {bankName && <DetailItem label="Bank" value={bankName} />}

              {accountNumber && (
                <DetailItem label="Account" value={`****${accountNumber.slice(-4)}`} />
              )}

              {transaction.balanceAfter !== undefined && transaction.balanceAfter !== null && (
                <DetailItem
                  label="Balance After"
                  value={formatCurrency(transaction.balanceAfter)}
                />
              )}

              {transaction.reference && (
                <DetailItem label="Reference" value={transaction.reference} />
              )}

              {transaction.categoryId && (
                <DetailItem label="Category ID" value={transaction.categoryId} />
              )}
            </YStack>

            <Stack height={32} />
          </ScrollView>

          <FooterSection>
            <Button variant="secondary" size="lg" fullWidth onPress={onClose}>
              Close
            </Button>
          </FooterSection>
        </ModalContent>
      </Backdrop>
    </Modal>
  );
}

export type { TransactionDetailProps };
