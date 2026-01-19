import { useCallback, useRef, memo } from 'react';

import { StyleSheet, Pressable } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Stack, Text, XStack } from 'tamagui';

import { useHaptics } from '@/shared/hooks/useHaptics';
import { colors } from '@/shared/theme';

import { TransactionItem } from './TransactionItem';

import type Transaction from '@/infrastructure/database/models/Transaction';

interface SwipeableTransactionItemProps {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  formatTime?: (date: Date) => string;
  onPress?: (transactionId: string) => void;
  onDelete?: (transactionId: string) => void;
  onCategorize?: (transactionId: string) => void;
  showBankAccent?: boolean;
  enableSwipe?: boolean;
}

interface SwipeActionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  backgroundColor: string;
  onPress: () => void;
}

function SwipeAction({
  icon,
  label,
  backgroundColor,
  onPress,
}: SwipeActionProps): React.ReactElement {
  const { medium } = useHaptics();

  const handlePress = useCallback(() => {
    medium();
    onPress();
  }, [medium, onPress]);

  return (
    <Pressable
      style={[styles.swipeAction, { backgroundColor }]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Stack alignItems="center" justifyContent="center" gap="$1">
        <MaterialCommunityIcons name={icon} size={24} color={colors.text.primary} />
        <Text color="$textPrimary" fontSize="$1" fontWeight="600">
          {label}
        </Text>
      </Stack>
    </Pressable>
  );
}

const RightActionsComponent = memo(function RightActions({
  onDelete,
}: {
  onDelete: () => void;
}): React.ReactElement {
  return (
    <XStack marginRight="$4">
      <SwipeAction
        icon="delete-outline"
        label="Delete"
        backgroundColor={colors.accent.danger}
        onPress={onDelete}
      />
    </XStack>
  );
});

const LeftActionsComponent = memo(function LeftActions({
  onCategorize,
}: {
  onCategorize: () => void;
}): React.ReactElement {
  return (
    <XStack marginLeft="$4">
      <SwipeAction
        icon="tag-outline"
        label="Category"
        backgroundColor={colors.accent.primary}
        onPress={onCategorize}
      />
    </XStack>
  );
});

export const SwipeableTransactionItem = memo(function SwipeableTransactionItem({
  transaction,
  formatCurrency,
  formatTime,
  onPress,
  onDelete,
  onCategorize,
  showBankAccent = false,
  enableSwipe = true,
}: SwipeableTransactionItemProps): React.ReactElement {
  const swipeableRef = useRef<Swipeable>(null);
  const { light, warning } = useHaptics();

  const handleDelete = useCallback(() => {
    warning();
    swipeableRef.current?.close();
    onDelete?.(transaction.id);
  }, [onDelete, transaction.id, warning]);

  const handleCategorize = useCallback(() => {
    light();
    swipeableRef.current?.close();
    onCategorize?.(transaction.id);
  }, [onCategorize, transaction.id, light]);

  const handleSwipeableOpen = useCallback(
    (_direction: 'left' | 'right') => {
      light();
    },
    [light]
  );

  const renderRightActions = useCallback(() => {
    if (!onDelete) {
      return null;
    }
    return <RightActionsComponent onDelete={handleDelete} />;
  }, [handleDelete, onDelete]);

  const renderLeftActions = useCallback(() => {
    if (!onCategorize) {
      return null;
    }
    return <LeftActionsComponent onCategorize={handleCategorize} />;
  }, [handleCategorize, onCategorize]);

  if (!enableSwipe || (!onDelete && !onCategorize)) {
    return (
      <TransactionItem
        transaction={transaction}
        formatCurrency={formatCurrency}
        formatTime={formatTime}
        onPress={onPress}
        showBankAccent={showBankAccent}
      />
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      renderLeftActions={onCategorize ? renderLeftActions : undefined}
      onSwipeableOpen={handleSwipeableOpen}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
    >
      <TransactionItem
        transaction={transaction}
        formatCurrency={formatCurrency}
        formatTime={formatTime}
        onPress={onPress}
        showBankAccent={showBankAccent}
      />
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  swipeAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export type { SwipeableTransactionItemProps };
