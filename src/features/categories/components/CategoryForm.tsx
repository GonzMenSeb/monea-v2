import { useState, useCallback, useEffect } from 'react';

import { Pressable } from 'react-native';

import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Button, Input, Caption } from '@/shared/components/ui';

import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { CATEGORY_COLORS, getCategoryEmoji } from '../types';

import type { CategoryFormData } from '../types';
import type { CategoryIcon } from '@/infrastructure/database';

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>;
  isEditing?: boolean;
  isLoading?: boolean;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
}

const Container = styled(YStack, {
  name: 'CategoryFormContainer',
  gap: '$4',
  padding: '$4',
});

const TypeToggleContainer = styled(YStack, {
  name: 'TypeToggleContainer',
  gap: '$2',
});

const TypeToggle = styled(XStack, {
  name: 'TypeToggle',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$3',
  padding: '$1',
});

const TypeButton = styled(Stack, {
  name: 'TypeButton',
  flex: 1,
  paddingVertical: '$2',
  borderRadius: '$2',
  alignItems: 'center',
});

const PreviewContainer = styled(YStack, {
  name: 'CategoryPreview',
  alignItems: 'center',
  padding: '$4',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  gap: '$2',
});

const PreviewCircle = styled(Stack, {
  name: 'PreviewCircle',
  width: 72,
  height: 72,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
});

const ButtonContainer = styled(XStack, {
  name: 'FormButtons',
  gap: '$3',
  marginTop: '$4',
});

export function CategoryForm({
  initialData,
  isEditing = false,
  isLoading = false,
  onSubmit,
  onCancel,
}: CategoryFormProps): React.ReactElement {
  const [name, setName] = useState(initialData?.name ?? '');
  const [icon, setIcon] = useState<CategoryIcon>(initialData?.icon ?? 'other');
  const [color, setColor] = useState(initialData?.color ?? CATEGORY_COLORS[0]);
  const [isIncome, setIsIncome] = useState(initialData?.isIncome ?? false);
  const [nameError, setNameError] = useState<string | undefined>();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? '');
      setIcon(initialData.icon ?? 'other');
      setColor(initialData.color ?? CATEGORY_COLORS[0]);
      setIsIncome(initialData.isIncome ?? false);
    }
  }, [initialData]);

  const validateName = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (value.length > 30) {
      setNameError('Name must be 30 characters or less');
      return false;
    }
    setNameError(undefined);
    return true;
  }, []);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (nameError) {
        validateName(value);
      }
    },
    [nameError, validateName]
  );

  const handleSubmit = useCallback(() => {
    if (!validateName(name)) {
      return;
    }

    onSubmit({
      name: name.trim(),
      icon,
      color,
      isIncome,
    });
  }, [name, icon, color, isIncome, validateName, onSubmit]);

  const emoji = getCategoryEmoji(icon);

  return (
    <Container>
      <PreviewContainer>
        <PreviewCircle backgroundColor={color + '20'}>
          <Text fontSize="$8">{emoji}</Text>
        </PreviewCircle>
        <Text color="$textPrimary" fontWeight="600" fontSize="$4">
          {name || 'Category Name'}
        </Text>
        <Caption color="$textSecondary">{isIncome ? 'Income' : 'Expense'}</Caption>
      </PreviewContainer>

      <Input
        label="Category Name"
        placeholder="Enter category name"
        value={name}
        onChangeText={handleNameChange}
        errorMessage={nameError}
        autoCapitalize="words"
        maxLength={30}
      />

      <TypeToggleContainer>
        <Caption color="$textSecondary">Category Type</Caption>
        <TypeToggle>
          <Pressable style={{ flex: 1 }} onPress={() => setIsIncome(false)}>
            <TypeButton backgroundColor={!isIncome ? '$accentDanger' : 'transparent'}>
              <Text
                color={!isIncome ? '$white' : '$textSecondary'}
                fontWeight={!isIncome ? '600' : '400'}
              >
                Expense
              </Text>
            </TypeButton>
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => setIsIncome(true)}>
            <TypeButton backgroundColor={isIncome ? '$accentPrimary' : 'transparent'}>
              <Text
                color={isIncome ? '$textInverse' : '$textSecondary'}
                fontWeight={isIncome ? '600' : '400'}
              >
                Income
              </Text>
            </TypeButton>
          </Pressable>
        </TypeToggle>
      </TypeToggleContainer>

      <IconPicker value={icon} onChange={setIcon} selectedColor={color} />

      <ColorPicker value={color} onChange={setColor} />

      <ButtonContainer>
        <Button variant="ghost" onPress={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Stack flex={1}>
          <Button
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !name.trim()}
            fullWidth
          >
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </Stack>
      </ButtonContainer>
    </Container>
  );
}
