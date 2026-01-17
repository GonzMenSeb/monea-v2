import { useCallback, memo } from 'react';

import { View } from 'react-native';

import { TransactionCard } from '@/shared/components/ui/Card';

import type Transaction from '@/infrastructure/database/models/Transaction';

interface TransactionItemProps {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  formatTime?: (date: Date) => string;
  onPress?: (transactionId: string) => void;
  showBankAccent?: boolean;
}

const CONTAINER_STYLES = 'px-4';

function defaultFormatTime(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export const TransactionItem = memo(function TransactionItem({
  transaction,
  formatCurrency,
  formatTime = defaultFormatTime,
  onPress,
  showBankAccent = false,
}: TransactionItemProps): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress?.(transaction.id);
  }, [transaction.id, onPress]);

  return (
    <View className={CONTAINER_STYLES}>
      <TransactionCard
        transaction={{
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          merchant: transaction.merchant,
          description: transaction.description,
          transactionDate: transaction.transactionDate,
          bankName: showBankAccent ? undefined : undefined,
        }}
        formatCurrency={formatCurrency}
        formatDate={formatTime}
        onPress={onPress ? handlePress : undefined}
      />
    </View>
  );
});

export type { TransactionItemProps };
