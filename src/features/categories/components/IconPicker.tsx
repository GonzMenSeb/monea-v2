import { useCallback } from 'react';

import { Pressable } from 'react-native';

import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Caption } from '@/shared/components/ui';

import { CATEGORY_ICONS } from '../types';

import type { CategoryIcon } from '@/infrastructure/database';

interface IconPickerProps {
  value: CategoryIcon;
  onChange: (icon: CategoryIcon) => void;
  selectedColor?: string;
}

const Container = styled(YStack, {
  name: 'IconPickerContainer',
  gap: '$2',
});

const Grid = styled(XStack, {
  name: 'IconPickerGrid',
  flexWrap: 'wrap',
  gap: '$2',
});

const IconButton = styled(Stack, {
  name: 'IconPickerButton',
  width: 56,
  height: 56,
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
});

export function IconPicker({
  value,
  onChange,
  selectedColor = '#00D4AA',
}: IconPickerProps): React.ReactElement {
  const handleSelect = useCallback(
    (icon: CategoryIcon) => {
      onChange(icon);
    },
    [onChange]
  );

  return (
    <Container>
      <Caption color="$textSecondary">Select Icon</Caption>
      <Grid>
        {CATEGORY_ICONS.map((iconOption) => {
          const isSelected = value === iconOption.value;
          return (
            <Pressable
              key={iconOption.value}
              onPress={() => handleSelect(iconOption.value)}
              accessibilityRole="button"
              accessibilityLabel={iconOption.label}
              accessibilityState={{ selected: isSelected }}
            >
              {({ pressed }) => (
                <IconButton
                  backgroundColor={isSelected ? selectedColor + '20' : '$backgroundSurface'}
                  borderColor={isSelected ? selectedColor : '$border'}
                  opacity={pressed ? 0.7 : 1}
                >
                  <Text fontSize="$5">{iconOption.emoji}</Text>
                </IconButton>
              )}
            </Pressable>
          );
        })}
      </Grid>
    </Container>
  );
}
