import { useCallback, useState } from 'react';

import { Modal, Pressable, SectionList } from 'react-native';

import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { useCategories, getCategoryEmoji } from '@/features/categories';
import { Body, Caption, Button } from '@/shared/components/ui';

import type Category from '@/infrastructure/database/models/Category';

interface CategorySelectorProps {
  value: string | null;
  onChange: (categoryId: string | undefined) => void;
  transactionType: 'income' | 'expense' | 'transfer_in' | 'transfer_out';
  label?: string;
  disabled?: boolean;
}

interface CategorySection {
  title: string;
  data: Category[];
}

const Container = styled(YStack, {
  name: 'CategorySelectorContainer',
  width: '100%',
});

const Label = styled(Text, {
  name: 'CategorySelectorLabel',
  color: '$textPrimary',
  fontWeight: '500',
  marginBottom: '$1.5',
  fontSize: '$2',
});

const SelectorButton = styled(XStack, {
  name: 'CategorySelectorButton',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$3',
  borderWidth: 2,
  borderColor: '$border',
  alignItems: 'center',
  minHeight: 56,
  paddingHorizontal: '$4',
});

const SelectedCategory = styled(XStack, {
  name: 'SelectedCategory',
  flex: 1,
  alignItems: 'center',
  gap: '$3',
});

const CategoryIcon = styled(Stack, {
  name: 'CategoryIcon',
  width: 40,
  height: 40,
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
});

const Chevron = styled(Text, {
  name: 'Chevron',
  color: '$textMuted',
  fontSize: '$4',
});

const ModalContainer = styled(Stack, {
  name: 'ModalContainer',
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.8)',
  justifyContent: 'flex-end',
});

const ModalContent = styled(YStack, {
  name: 'ModalContent',
  backgroundColor: '$backgroundBase',
  borderTopLeftRadius: '$6',
  borderTopRightRadius: '$6',
  maxHeight: '70%',
});

const ModalHeader = styled(XStack, {
  name: 'ModalHeader',
  paddingHorizontal: '$4',
  paddingVertical: '$4',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
});

const SectionHeader = styled(Stack, {
  name: 'CategorySectionHeader',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  backgroundColor: '$backgroundBase',
});

const SectionTitle = styled(Text, {
  name: 'CategorySectionTitle',
  color: '$textSecondary',
  fontSize: '$1',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

const CategoryItem = styled(XStack, {
  name: 'CategoryItem',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  gap: '$3',
});

const ItemSeparator = styled(Stack, {
  name: 'ItemSeparator',
  height: 1,
  backgroundColor: '$border',
  marginLeft: 68,
});

const ClearOption = styled(XStack, {
  name: 'ClearOption',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  gap: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
});

export function CategorySelector({
  value,
  onChange,
  transactionType,
  label = 'Category',
  disabled = false,
}: CategorySelectorProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const { data: categories = [] } = useCategories();

  const isIncome = transactionType === 'income' || transactionType === 'transfer_in';
  const filteredCategories = categories.filter((c) => c.isIncome === isIncome);

  const selectedCategory = categories.find((c) => c.id === value);

  const sections: CategorySection[] = [
    {
      title: isIncome ? 'Income Categories' : 'Expense Categories',
      data: filteredCategories,
    },
  ];

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (category: Category) => {
      onChange(category.id);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange(undefined);
    setIsOpen(false);
  }, [onChange]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: CategorySection }) => (
      <SectionHeader>
        <SectionTitle>{section.title}</SectionTitle>
      </SectionHeader>
    ),
    []
  );

  const renderCategory = useCallback(
    ({ item }: { item: Category }) => {
      const isSelected = item.id === value;
      const emoji = getCategoryEmoji(item.icon);

      return (
        <Pressable onPress={() => handleSelect(item)} accessibilityRole="button">
          {({ pressed }) => (
            <CategoryItem
              opacity={pressed ? 0.7 : 1}
              backgroundColor={isSelected ? '$primaryMuted' : 'transparent'}
            >
              <CategoryIcon backgroundColor={item.color + '20'}>
                <Text fontSize="$5">{emoji}</Text>
              </CategoryIcon>
              <Body flex={1}>{item.name}</Body>
              {isSelected && (
                <Text color="$accentPrimary" fontSize="$4">
                  ✓
                </Text>
              )}
            </CategoryItem>
          )}
        </Pressable>
      );
    },
    [value, handleSelect]
  );

  const renderSeparator = useCallback(() => <ItemSeparator />, []);

  return (
    <Container>
      <Label>{label}</Label>
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {({ pressed }) => (
          <SelectorButton opacity={disabled ? 0.6 : pressed ? 0.8 : 1}>
            <SelectedCategory>
              {selectedCategory ? (
                <>
                  <CategoryIcon backgroundColor={selectedCategory.color + '20'}>
                    <Text fontSize="$5">{getCategoryEmoji(selectedCategory.icon)}</Text>
                  </CategoryIcon>
                  <Body flex={1}>{selectedCategory.name}</Body>
                </>
              ) : (
                <Body color="$textMuted">Select a category (optional)</Body>
              )}
            </SelectedCategory>
            <Chevron>›</Chevron>
          </SelectorButton>
        )}
      </Pressable>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
        <ModalContainer>
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
          <ModalContent>
            <ModalHeader>
              <Body fontWeight="600">Select Category</Body>
              <Button variant="ghost" size="sm" onPress={handleClose}>
                Done
              </Button>
            </ModalHeader>

            {value && (
              <Pressable onPress={handleClear} accessibilityRole="button">
                {({ pressed }) => (
                  <ClearOption opacity={pressed ? 0.7 : 1}>
                    <CategoryIcon backgroundColor="$backgroundElevated">
                      <Text fontSize="$3">✕</Text>
                    </CategoryIcon>
                    <Body color="$textSecondary">No category</Body>
                  </ClearOption>
                )}
              </Pressable>
            )}

            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={renderCategory}
              renderSectionHeader={renderSectionHeader}
              ItemSeparatorComponent={renderSeparator}
              stickySectionHeadersEnabled
              contentContainerStyle={{ paddingBottom: 32 }}
              ListEmptyComponent={
                <YStack padding="$6" alignItems="center">
                  <Body color="$textSecondary">No categories available</Body>
                  <Caption color="$textMuted" marginTop="$1">
                    Create categories in Settings
                  </Caption>
                </YStack>
              }
            />
          </ModalContent>
        </ModalContainer>
      </Modal>
    </Container>
  );
}
