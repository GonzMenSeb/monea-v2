import { memo, useCallback } from 'react';

import { Pressable } from 'react-native';

import { styled, Stack, Text, XStack } from 'tamagui';

import { Body, Caption } from '@/shared/components/ui';

import { getCategoryEmoji } from '../types';

import type { CategoryIcon } from '@/infrastructure/database';

interface CategoryItemProps {
  id: string;
  name: string;
  icon: CategoryIcon;
  color: string;
  isSystem: boolean;
  isIncome: boolean;
  transactionCount?: number;
  onPress?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ItemContainer = styled(XStack, {
  name: 'CategoryItemContainer',
  alignItems: 'center',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  backgroundColor: '$backgroundSurface',
});

const IconCircle = styled(Stack, {
  name: 'CategoryIconCircle',
  width: 44,
  height: 44,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '$3',
});

const ContentContainer = styled(Stack, {
  name: 'CategoryContent',
  flex: 1,
});

const TypeBadge = styled(Stack, {
  name: 'CategoryTypeBadge',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$2',
  marginLeft: '$2',
});

const CountBadge = styled(Stack, {
  name: 'CategoryCountBadge',
  backgroundColor: '$backgroundElevated',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
  marginRight: '$2',
});

const Chevron = styled(Text, {
  name: 'Chevron',
  color: '$textMuted',
  fontSize: '$4',
});

export const CategoryItem = memo(function CategoryItem({
  id,
  name,
  icon,
  color,
  isSystem,
  isIncome,
  transactionCount,
  onPress,
}: CategoryItemProps): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress?.(id);
  }, [id, onPress]);

  const emoji = getCategoryEmoji(icon);

  return (
    <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={name}>
      {({ pressed }) => (
        <ItemContainer opacity={pressed ? 0.7 : 1}>
          <IconCircle backgroundColor={color + '20'}>
            <Text fontSize="$5">{emoji}</Text>
          </IconCircle>

          <ContentContainer>
            <XStack alignItems="center">
              <Body>{name}</Body>
              {isSystem && (
                <TypeBadge backgroundColor="$backgroundElevated">
                  <Caption color="$textMuted" fontSize="$1">
                    System
                  </Caption>
                </TypeBadge>
              )}
            </XStack>
            <Caption color="$textSecondary">{isIncome ? 'Income' : 'Expense'}</Caption>
          </ContentContainer>

          {transactionCount !== undefined && transactionCount > 0 && (
            <CountBadge>
              <Caption color="$textSecondary">{transactionCount}</Caption>
            </CountBadge>
          )}

          <Chevron>{'›'}</Chevron>
        </ItemContainer>
      )}
    </Pressable>
  );
});

export type { CategoryItemProps };
