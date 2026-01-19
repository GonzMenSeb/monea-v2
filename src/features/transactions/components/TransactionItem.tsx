import { useCallback, memo } from 'react';

import { Stack } from 'tamagui';

import { TransactionCard } from '@/shared/components/ui/Card';

import type Transaction from '@/infrastructure/database/models/Transaction';

interface TransactionItemProps {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  formatTime?: (date: Date) => string;
  onPress?: (transactionId: string) => void;
  showBankAccent?: boolean;
}

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
}: TransactionItemProps): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress?.(transaction.id);
  }, [transaction.id, onPress]);

  return (
    <Stack paddingHorizontal="$4">
      <TransactionCard
        transaction={{
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          merchant: transaction.merchant,
          description: transaction.description,
          transactionDate: transaction.transactionDate,
        }}
        formatCurrency={formatCurrency}
        formatDate={formatTime}
        onPress={onPress ? handlePress : undefined}
      />
    </Stack>
  );
});

export type { TransactionItemProps };
