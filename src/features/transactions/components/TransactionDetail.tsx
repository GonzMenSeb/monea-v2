import { useCallback } from 'react';

import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

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

interface DetailRowProps {
  label: string;
  value: string;
  valueStyle?: StyleProp<ViewStyle>;
}

const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  { sign: string; colorClass: string; label: string }
> = {
  income: { sign: '+', colorClass: 'text-transaction-income', label: 'Income' },
  expense: { sign: '-', colorClass: 'text-transaction-expense', label: 'Expense' },
  transfer_in: { sign: '+', colorClass: 'text-transaction-transfer', label: 'Transfer In' },
  transfer_out: { sign: '-', colorClass: 'text-transaction-transfer', label: 'Transfer Out' },
};

const BANK_COLORS: Record<string, string> = {
  bancolombia: 'bg-bancolombia-yellow',
  davivienda: 'bg-davivienda-red',
  bbva: 'bg-bbva-blue',
  nequi: 'bg-nequi-pink',
  daviplata: 'bg-daviplata-orange',
};

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

function DetailRow({ label, value }: DetailRowProps): React.ReactElement {
  return (
    <View className="flex-row justify-between items-start py-3 border-b border-gray-100">
      <Text className="text-sm text-text-secondary flex-shrink-0 mr-4">{label}</Text>
      <Text className="text-sm text-text-primary font-medium text-right flex-1" numberOfLines={2}>
        {value}
      </Text>
    </View>
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

  const handleContentPress = useCallback(() => {
    // Prevent closing when pressing the content
  }, []);

  if (!transaction) {
    return null;
  }

  const typeConfig = TRANSACTION_TYPE_CONFIG[transaction.type];
  const formattedAmount = `${typeConfig.sign}${formatCurrency(transaction.amount)}`;
  const displayTitle = transaction.merchant || transaction.description || typeConfig.label;
  const bankAccentClass =
    bankName && BANK_COLORS[bankName.toLowerCase()]
      ? BANK_COLORS[bankName.toLowerCase()]
      : 'bg-primary-500';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-surface-overlay justify-end"
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel="Close transaction details"
      >
        <Pressable onPress={handleContentPress} className="bg-white rounded-t-3xl max-h-[85%]">
          <View className={`h-1 w-12 ${bankAccentClass} rounded-full self-center mt-3 mb-2`} />

          <View className="px-6 pt-4 pb-6 border-b border-gray-100">
            <Text className="text-lg text-text-secondary text-center mb-1">{typeConfig.label}</Text>
            <Text
              className={`text-4xl font-bold ${typeConfig.colorClass} text-center`}
              accessibilityLabel={`Amount: ${formattedAmount}`}
            >
              {formattedAmount}
            </Text>
            <Text className="text-lg font-semibold text-text-primary text-center mt-3">
              {displayTitle}
            </Text>
          </View>

          <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
            <View className="py-2">
              <DetailRow label="Date" value={formatDateTime(transaction.transactionDate)} />

              {transaction.description && transaction.merchant && (
                <DetailRow label="Description" value={transaction.description} />
              )}

              {bankName && <DetailRow label="Bank" value={bankName} />}

              {accountNumber && (
                <DetailRow label="Account" value={`****${accountNumber.slice(-4)}`} />
              )}

              {transaction.balanceAfter !== undefined && transaction.balanceAfter !== null && (
                <DetailRow label="Balance After" value={formatCurrency(transaction.balanceAfter)} />
              )}

              {transaction.reference && (
                <DetailRow label="Reference" value={transaction.reference} />
              )}

              {transaction.categoryId && (
                <DetailRow label="Category ID" value={transaction.categoryId} />
              )}
            </View>

            <View className="h-8" />
          </ScrollView>

          <View className="px-6 pb-8 pt-4 border-t border-gray-100">
            <Pressable
              className="bg-background-tertiary py-3.5 rounded-xl active:bg-gray-200"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text className="text-base font-semibold text-text-primary text-center">Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export type { TransactionDetailProps };
