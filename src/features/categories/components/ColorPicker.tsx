import { useCallback } from 'react';

import { Pressable } from 'react-native';

import { styled, Stack, XStack, YStack } from 'tamagui';

import { Caption } from '@/shared/components/ui';

import { CATEGORY_COLORS } from '../types';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const Container = styled(YStack, {
  name: 'ColorPickerContainer',
  gap: '$2',
});

const Grid = styled(XStack, {
  name: 'ColorPickerGrid',
  flexWrap: 'wrap',
  gap: '$2',
});

const ColorButton = styled(Stack, {
  name: 'ColorPickerButton',
  width: 44,
  height: 44,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 3,
});

const InnerCircle = styled(Stack, {
  name: 'ColorPickerInner',
  width: 32,
  height: 32,
  borderRadius: '$full',
});

export function ColorPicker({ value, onChange }: ColorPickerProps): React.ReactElement {
  const handleSelect = useCallback(
    (color: string) => {
      onChange(color);
    },
    [onChange]
  );

  return (
    <Container>
      <Caption color="$textSecondary">Select Color</Caption>
      <Grid>
        {CATEGORY_COLORS.map((color) => {
          const isSelected = value === color;
          return (
            <Pressable
              key={color}
              onPress={() => handleSelect(color)}
              accessibilityRole="button"
              accessibilityLabel={`Color ${color}`}
              accessibilityState={{ selected: isSelected }}
            >
              {({ pressed }) => (
                <ColorButton
                  borderColor={isSelected ? color : 'transparent'}
                  opacity={pressed ? 0.7 : 1}
                >
                  <InnerCircle backgroundColor={color} />
                </ColorButton>
              )}
            </Pressable>
          );
        })}
      </Grid>
    </Container>
  );
}
