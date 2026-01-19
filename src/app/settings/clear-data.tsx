import { useCallback, useState } from 'react';

import { Pressable, ScrollView, Alert } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { database } from '@/infrastructure/database';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Caption, Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

const Header = styled(XStack, {
  name: 'Header',
  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$2',
  alignItems: 'center',
});

const BackButton = styled(XStack, {
  name: 'BackButton',
  alignItems: 'center',
  gap: '$1',
  flex: 1,
});

const ContentContainer = styled(YStack, {
  name: 'ContentContainer',
  padding: '$4',
  gap: '$4',
});

const WarningCard = styled(YStack, {
  name: 'WarningCard',
  backgroundColor: '$dangerMuted',
  borderRadius: '$4',
  padding: '$4',
  gap: '$3',
  alignItems: 'center',
});

const Card = styled(YStack, {
  name: 'Card',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$3',
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 64,
  height: 64,
  borderRadius: '$full',
  backgroundColor: '$danger',
  alignItems: 'center',
  justifyContent: 'center',
});

const DataItem = styled(XStack, {
  name: 'DataItem',
  alignItems: 'center',
  gap: '$2',
  paddingVertical: '$2',
});

export default function ClearDataScreen(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete all transactions, accounts, and custom categories. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: performClearData,
                },
              ]
            );
          },
        },
      ]
    );
  }, []);

  const performClearData = useCallback(async () => {
    setIsClearing(true);
    try {
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });

      queryClient.clear();

      Alert.alert('Data Cleared', 'All your data has been deleted successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to clear data. Please try again.'
      );
    } finally {
      setIsClearing(false);
    }
  }, [queryClient, router]);

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <Header>
        <Pressable
          onPress={handleBack}
          disabled={isClearing}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          {({ pressed }) => (
            <BackButton opacity={pressed && !isClearing ? 0.7 : isClearing ? 0.3 : 1}>
              <Text color="$accentPrimary" fontSize="$5">
                ‹
              </Text>
              <Body color="$accentPrimary">Back</Body>
            </BackButton>
          )}
        </Pressable>
        <Heading level="h3">Clear Data</Heading>
        <XStack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ContentContainer>
          <WarningCard>
            <IconContainer>
              <Text fontSize="$6" color="$textInverse">
                🗑️
              </Text>
            </IconContainer>
            <Body fontWeight="600" color="$danger" textAlign="center">
              Danger Zone
            </Body>
            <Caption color="$danger" textAlign="center">
              Clearing your data will permanently delete all information stored in the app. This
              action cannot be undone.
            </Caption>
          </WarningCard>

          <Card>
            <Body fontWeight="600">What will be deleted:</Body>
            <DataItem>
              <Text fontSize="$3">💳</Text>
              <Body>All transactions</Body>
            </DataItem>
            <DataItem>
              <Text fontSize="$3">🏦</Text>
              <Body>All bank accounts</Body>
            </DataItem>
            <DataItem>
              <Text fontSize="$3">📂</Text>
              <Body>Custom categories</Body>
            </DataItem>
            <DataItem>
              <Text fontSize="$3">📱</Text>
              <Body>Processed SMS records</Body>
            </DataItem>
          </Card>

          <Card>
            <Body fontWeight="600">Before you proceed:</Body>
            <Caption color="$textSecondary" lineHeight={20}>
              • Consider exporting a backup first from Settings → Backup & Restore
            </Caption>
            <Caption color="$textSecondary" lineHeight={20}>
              • System categories will be restored on next app launch
            </Caption>
            <Caption color="$textSecondary" lineHeight={20}>
              • You can re-import your SMS history after clearing
            </Caption>
          </Card>

          <Button
            variant="primary"
            onPress={handleClearData}
            loading={isClearing}
            disabled={isClearing}
            fullWidth
            style={{ backgroundColor: colors.accent.danger }}
          >
            Clear All Data
          </Button>
        </ContentContainer>
      </ScrollView>
    </Screen>
  );
}
