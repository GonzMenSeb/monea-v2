import { useCallback } from 'react';

import { styled, Stack, Text, XStack, YStack, type GetProps } from 'tamagui';

import { colors } from '@/shared/theme';

import type { TransactionType } from '@/infrastructure/database';

type CardVariant = 'surface' | 'elevated' | 'glass';

const CardFrame = styled(Stack, {
  name: 'Card',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  borderWidth: 1,
  borderColor: '$border',

  variants: {
    variant: {
      surface: {
        backgroundColor: '$backgroundSurface',
      },
      elevated: {
        backgroundColor: '$backgroundElevated',
        shadowColor: '$black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      },
      glass: {
        backgroundColor: 'rgba(18, 20, 26, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.9,
          scale: 0.99,
          borderColor: '$accentPrimary',
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'surface',
  },
});

interface BaseCardProps extends GetProps<typeof CardFrame> {
  variant?: CardVariant;
}

export function Card({
  children,
  variant = 'surface',
  onPress,
  ...props
}: BaseCardProps): React.ReactElement {
  if (!onPress) {
    return (
      <CardFrame variant={variant} {...props}>
        {children}
      </CardFrame>
    );
  }

  return (
    <CardFrame
      variant={variant}
      pressable
      onPress={onPress}
      animation="fast"
      accessibilityRole="button"
      {...props}
    >
      {children}
    </CardFrame>
  );
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

interface TransactionCardProps {
  transaction: TransactionCardData;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  onPress?: () => void;
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

const BANK_ACCENT_COLORS: Record<string, string> = {
  bancolombia: colors.bancolombia.yellow,
  davivienda: colors.davivienda.red,
  bbva: colors.bbva.blue,
  nequi: colors.nequi.pink,
  daviplata: colors.daviplata.orange,
};

export function TransactionCard({
  transaction,
  formatCurrency,
  formatDate,
  onPress,
}: TransactionCardProps): React.ReactElement {
  const typeConfig = TRANSACTION_TYPE_CONFIG[transaction.type];
  const bankAccent = transaction.bankName
    ? BANK_ACCENT_COLORS[transaction.bankName.toLowerCase()] || colors.accent.primary
    : colors.accent.primary;

  const displayTitle = transaction.merchant || transaction.description || typeConfig.label;
  const formattedAmount = `${typeConfig.sign}${formatCurrency(transaction.amount)}`;

  const content = (
    <XStack alignItems="flex-start" justifyContent="space-between">
      <YStack flex={1} marginRight="$3">
        <Text color="$textPrimary" fontSize="$3" fontWeight="600" numberOfLines={1}>
          {displayTitle}
        </Text>
        {transaction.description && transaction.merchant && (
          <Text color="$textSecondary" fontSize="$2" marginTop="$0.5" numberOfLines={1}>
            {transaction.description}
          </Text>
        )}
        <Text color="$textMuted" fontSize="$1" marginTop="$2">
          {formatDate(transaction.transactionDate)}
        </Text>
      </YStack>
      <Text fontFamily="$mono" fontSize="$3" fontWeight="700" color={typeConfig.color}>
        {formattedAmount}
      </Text>
    </XStack>
  );

  if (!onPress) {
    return (
      <CardFrame variant="surface" borderLeftWidth={4} borderLeftColor={bankAccent}>
        {content}
      </CardFrame>
    );
  }

  return (
    <CardFrame
      variant="surface"
      borderLeftWidth={4}
      borderLeftColor={bankAccent}
      pressable
      onPress={onPress}
      animation="fast"
      accessibilityRole="button"
      accessibilityLabel={`${displayTitle}, ${formattedAmount}`}
    >
      {content}
    </CardFrame>
  );
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

interface AccountCardProps {
  account: AccountCardData;
  formatCurrency: (amount: number) => string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }
  return `****${accountNumber.slice(-4)}`;
}

export function AccountCard({
  account,
  formatCurrency,
  onSelect,
  disabled,
}: AccountCardProps): React.ReactElement {
  const bankAccent = BANK_ACCENT_COLORS[account.bankCode.toLowerCase()] || colors.accent.primary;
  const maskedNumber = maskAccountNumber(account.accountNumber);

  const handlePress = useCallback(() => {
    onSelect(account.id);
  }, [account.id, onSelect]);

  const isDisabled = disabled || !account.isActive;

  return (
    <CardFrame
      variant="elevated"
      borderLeftWidth={4}
      borderLeftColor={bankAccent}
      pressable={!isDisabled}
      onPress={isDisabled ? undefined : handlePress}
      opacity={isDisabled ? 0.6 : 1}
      animation="fast"
      accessibilityRole="button"
      accessibilityLabel={`${account.bankName} account ending in ${account.accountNumber.slice(-4)}`}
      accessibilityState={{ disabled: isDisabled }}
    >
      <XStack alignItems="flex-start" justifyContent="space-between">
        <YStack>
          <Text color="$textPrimary" fontSize="$4" fontWeight="700">
            {account.bankName}
          </Text>
          <Text color="$textSecondary" fontSize="$2" marginTop="$0.5">
            {account.accountType} • {maskedNumber}
          </Text>
        </YStack>
        {!account.isActive && (
          <Stack
            backgroundColor="$backgroundElevated"
            paddingHorizontal="$2"
            paddingVertical="$0.5"
            borderRadius="$2"
          >
            <Text color="$textSecondary" fontSize="$1">
              Inactive
            </Text>
          </Stack>
        )}
      </XStack>
      <YStack marginTop="$3">
        <Text color="$textMuted" fontSize="$1">
          Balance
        </Text>
        <Text color="$textPrimary" fontFamily="$mono" fontSize="$6" fontWeight="700">
          {formatCurrency(account.balance)}
        </Text>
      </YStack>
    </CardFrame>
  );
}

export function GlassCard({ children, onPress, ...props }: BaseCardProps): React.ReactElement {
  return (
    <Card variant="glass" onPress={onPress} {...props}>
      {children}
    </Card>
  );
}
