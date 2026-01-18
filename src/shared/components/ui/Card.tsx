import { useCallback } from 'react';

import { Pressable, Text, View, type PressableProps } from 'react-native';

import type { TransactionType } from '@/infrastructure/database';

type CardVariant = 'transaction' | 'account' | 'elevated';

interface BaseCardProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode;
  variant?: CardVariant;
}

interface TransactionCardData {
  id: string;
  type: TransactionType;
  amount: number;
  merchant?: string;
  description?: string;
  transactionDate: Date;
  bankName?: string;
}

interface TransactionCardProps extends Omit<PressableProps, 'children'> {
  transaction: TransactionCardData;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

interface AccountCardData {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  isActive: boolean;
}

interface AccountCardProps extends Omit<PressableProps, 'children'> {
  account: AccountCardData;
  formatCurrency: (amount: number) => string;
  onSelect: (id: string) => void;
}

const BASE_CARD_STYLES = 'rounded-2xl p-4';

const VARIANT_STYLES: Record<CardVariant, { container: string; pressed: string }> = {
  transaction: {
    container: 'bg-surface-card border border-gray-100',
    pressed: 'bg-gray-50',
  },
  account: {
    container: 'bg-surface-card border border-gray-100 shadow-sm',
    pressed: 'bg-gray-50',
  },
  elevated: {
    container: 'bg-surface-elevated shadow-md',
    pressed: 'bg-gray-50',
  },
};

const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  { sign: string; color: string; label: string }
> = {
  income: { sign: '+', color: 'text-transaction-income', label: 'Income' },
  expense: { sign: '-', color: 'text-transaction-expense', label: 'Expense' },
  transfer_in: { sign: '+', color: 'text-transaction-transfer', label: 'Transfer In' },
  transfer_out: { sign: '-', color: 'text-transaction-transfer', label: 'Transfer Out' },
};

const BANK_ACCENT_COLORS: Record<string, string> = {
  bancolombia: 'border-l-bancolombia-yellow',
  davivienda: 'border-l-davivienda-red',
  bbva: 'border-l-bbva-blue',
  nequi: 'border-l-nequi-pink',
  daviplata: 'border-l-daviplata-orange',
};

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }
  return `****${accountNumber.slice(-4)}`;
}

export function Card({
  children,
  variant = 'elevated',
  disabled,
  onPress,
  ...pressableProps
}: BaseCardProps): React.ReactElement {
  const variantStyle = VARIANT_STYLES[variant];

  const getContainerStyle = (pressed: boolean): string => {
    return [
      BASE_CARD_STYLES,
      variantStyle.container,
      pressed && onPress ? variantStyle.pressed : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  if (!onPress) {
    return <View className={getContainerStyle(false)}>{children}</View>;
  }

  return (
    <Pressable {...pressableProps} disabled={disabled} onPress={onPress} accessibilityRole="button">
      {({ pressed }) => <View className={getContainerStyle(pressed)}>{children}</View>}
    </Pressable>
  );
}

export function TransactionCard({
  transaction,
  formatCurrency,
  formatDate,
  onPress,
  ...pressableProps
}: TransactionCardProps): React.ReactElement {
  const typeConfig = TRANSACTION_TYPE_CONFIG[transaction.type];
  const bankAccent = transaction.bankName
    ? BANK_ACCENT_COLORS[transaction.bankName.toLowerCase()] || 'border-l-primary-500'
    : 'border-l-primary-500';

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      onPress?.(event);
    },
    [onPress]
  );

  const displayTitle = transaction.merchant || transaction.description || typeConfig.label;
  const formattedAmount = `${typeConfig.sign}${formatCurrency(transaction.amount)}`;

  const getContainerStyle = (pressed: boolean): string => {
    return [
      BASE_CARD_STYLES,
      'border-l-4',
      bankAccent,
      VARIANT_STYLES.transaction.container,
      pressed && onPress ? VARIANT_STYLES.transaction.pressed : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const content = (pressed: boolean): React.ReactElement => (
    <View className={getContainerStyle(pressed)}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-text-primary" numberOfLines={1}>
            {displayTitle}
          </Text>
          {transaction.description && transaction.merchant && (
            <Text className="text-sm text-text-secondary mt-0.5" numberOfLines={1}>
              {transaction.description}
            </Text>
          )}
        </View>
        <Text className={`text-base font-bold ${typeConfig.color}`}>{formattedAmount}</Text>
      </View>
      <Text className="text-xs text-text-muted mt-2">
        {formatDate(transaction.transactionDate)}
      </Text>
    </View>
  );

  if (!onPress) {
    return content(false);
  }

  return (
    <Pressable
      {...pressableProps}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${displayTitle}, ${formattedAmount}`}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

export function AccountCard({
  account,
  formatCurrency,
  onSelect,
  disabled,
  ...pressableProps
}: AccountCardProps): React.ReactElement {
  const bankAccent = BANK_ACCENT_COLORS[account.bankCode.toLowerCase()] || 'border-l-primary-500';
  const maskedNumber = maskAccountNumber(account.accountNumber);

  const handlePress = useCallback(() => {
    onSelect(account.id);
  }, [account.id, onSelect]);

  const getContainerStyle = (pressed: boolean): string => {
    return [
      BASE_CARD_STYLES,
      'border-l-4',
      bankAccent,
      VARIANT_STYLES.account.container,
      pressed ? VARIANT_STYLES.account.pressed : '',
      !account.isActive ? 'opacity-60' : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  return (
    <Pressable
      {...pressableProps}
      disabled={disabled || !account.isActive}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${account.bankName} account ending in ${account.accountNumber.slice(-4)}`}
      accessibilityState={{ disabled: disabled || !account.isActive }}
    >
      {({ pressed }) => (
        <View className={getContainerStyle(pressed)}>
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-lg font-bold text-text-primary">{account.bankName}</Text>
              <Text className="text-sm text-text-secondary mt-0.5">
                {account.accountType} • {maskedNumber}
              </Text>
            </View>
            {!account.isActive && (
              <View className="bg-gray-200 px-2 py-0.5 rounded">
                <Text className="text-xs text-text-secondary">Inactive</Text>
              </View>
            )}
          </View>
          <View className="mt-3">
            <Text className="text-xs text-text-muted">Balance</Text>
            <Text className="text-xl font-bold text-text-primary">
              {formatCurrency(account.balance)}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}
