import { useCallback, memo } from 'react';

import { View, Text, Pressable, ScrollView } from 'react-native';

import { LoadingState } from '@/shared/components/feedback/LoadingState';
import { AccountCard } from '@/shared/components/ui/Card';

import type Account from '@/infrastructure/database/models/Account';

interface AccountsOverviewProps {
  accounts: Account[];
  isLoading?: boolean;
  error?: Error | null;
  onAccountPress?: (accountId: string) => void;
  onSeeAllPress?: () => void;
  onAddAccountPress?: () => void;
  formatCurrency: (amount: number) => string;
  maxItems?: number;
}

const CONTAINER_STYLES = 'mt-6';
const HEADER_CONTAINER_STYLES = 'flex-row justify-between items-center px-4 mb-3';
const TITLE_STYLES = 'text-lg font-semibold text-text-primary';
const SEE_ALL_STYLES = 'text-sm font-medium text-primary-500';
const SEE_ALL_PRESSED_STYLES = 'text-sm font-medium text-primary-700';
const SCROLL_CONTAINER_STYLES = 'pl-4';
const SCROLL_CONTENT_STYLES = 'pr-4';
const ITEM_STYLES = 'w-72 mr-3';
const ITEM_LAST_STYLES = 'w-72';
const EMPTY_CONTAINER_STYLES = 'py-8 items-center px-4';
const EMPTY_TEXT_STYLES = 'text-sm text-text-muted text-center';
const ERROR_TEXT_STYLES = 'text-sm text-semantic-error text-center';
const ADD_CARD_STYLES =
  'w-72 h-32 rounded-2xl border-2 border-dashed border-gray-300 items-center justify-center';
const ADD_CARD_PRESSED_STYLES =
  'w-72 h-32 rounded-2xl border-2 border-dashed border-primary-400 items-center justify-center bg-primary-50';
const ADD_TEXT_STYLES = 'text-sm font-medium text-text-secondary mt-2';
const ADD_ICON_STYLES = 'text-2xl text-text-secondary';

const AccountRow = memo(function AccountRow({
  account,
  formatCurrency,
  onPress,
  isLast,
}: {
  account: Account;
  formatCurrency: (amount: number) => string;
  onPress?: (id: string) => void;
  isLast: boolean;
}): React.ReactElement {
  const handleSelect = useCallback(
    (id: string) => {
      onPress?.(id);
    },
    [onPress]
  );

  return (
    <View className={isLast ? ITEM_LAST_STYLES : ITEM_STYLES}>
      <AccountCard
        account={{
          id: account.id,
          bankCode: account.bankCode,
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          balance: account.balance,
          isActive: account.isActive,
        }}
        formatCurrency={formatCurrency}
        onSelect={handleSelect}
      />
    </View>
  );
});

function AddAccountCard({ onPress }: { onPress?: () => void }): React.ReactElement | null {
  if (!onPress) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a new bank account"
    >
      {({ pressed }) => (
        <View className={pressed ? ADD_CARD_PRESSED_STYLES : ADD_CARD_STYLES}>
          <Text className={ADD_ICON_STYLES}>+</Text>
          <Text className={ADD_TEXT_STYLES}>Add Account</Text>
        </View>
      )}
    </Pressable>
  );
}

export function AccountsOverview({
  accounts,
  isLoading = false,
  error = null,
  onAccountPress,
  onSeeAllPress,
  onAddAccountPress,
  formatCurrency,
  maxItems = 5,
}: AccountsOverviewProps): React.ReactElement {
  const displayedAccounts = accounts.slice(0, maxItems);
  const hasMore = accounts.length > maxItems;

  if (isLoading && accounts.length === 0) {
    return (
      <View className={CONTAINER_STYLES}>
        <View className={HEADER_CONTAINER_STYLES}>
          <Text className={TITLE_STYLES}>Your Accounts</Text>
        </View>
        <LoadingState message="Loading accounts..." variant="inline" />
      </View>
    );
  }

  if (error) {
    return (
      <View className={CONTAINER_STYLES}>
        <View className={HEADER_CONTAINER_STYLES}>
          <Text className={TITLE_STYLES}>Your Accounts</Text>
        </View>
        <View className={EMPTY_CONTAINER_STYLES}>
          <Text className={ERROR_TEXT_STYLES}>Unable to load accounts</Text>
        </View>
      </View>
    );
  }

  if (displayedAccounts.length === 0) {
    return (
      <View className={CONTAINER_STYLES}>
        <View className={HEADER_CONTAINER_STYLES}>
          <Text className={TITLE_STYLES}>Your Accounts</Text>
        </View>
        <View className={EMPTY_CONTAINER_STYLES}>
          <Text className={EMPTY_TEXT_STYLES}>
            No accounts linked yet. Link your bank accounts to start tracking.
          </Text>
          {onAddAccountPress && (
            <View className="mt-4">
              <AddAccountCard onPress={onAddAccountPress} />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={CONTAINER_STYLES}>
      <View className={HEADER_CONTAINER_STYLES}>
        <Text className={TITLE_STYLES}>Your Accounts</Text>
        {(hasMore || onSeeAllPress) && (
          <Pressable
            onPress={onSeeAllPress}
            accessibilityRole="button"
            accessibilityLabel="See all accounts"
          >
            {({ pressed }) => (
              <Text className={pressed ? SEE_ALL_PRESSED_STYLES : SEE_ALL_STYLES}>See All</Text>
            )}
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className={SCROLL_CONTAINER_STYLES}
        contentContainerClassName={SCROLL_CONTENT_STYLES}
      >
        {displayedAccounts.map((account, index) => (
          <AccountRow
            key={account.id}
            account={account}
            formatCurrency={formatCurrency}
            onPress={onAccountPress}
            isLast={index === displayedAccounts.length - 1 && !onAddAccountPress}
          />
        ))}
        {onAddAccountPress && (
          <View className={ITEM_LAST_STYLES}>
            <AddAccountCard onPress={onAddAccountPress} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export type { AccountsOverviewProps };
