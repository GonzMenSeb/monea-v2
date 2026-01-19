import { useCallback } from 'react';

import { ScrollView, Pressable, Alert } from 'react-native';

import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { BackupCard, ImportResultCard, useBackup } from '@/features/backup';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Caption } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

const Header = styled(XStack, {
  name: 'BackupHeader',
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

const InfoCard = styled(YStack, {
  name: 'InfoCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$3',
});

const InfoItem = styled(XStack, {
  name: 'InfoItem',
  gap: '$3',
});

const InfoIcon = styled(Stack, {
  name: 'InfoIcon',
  width: 32,
  height: 32,
  borderRadius: '$2',
  backgroundColor: '$primaryMuted',
  alignItems: 'center',
  justifyContent: 'center',
});

const SuccessMessage = styled(YStack, {
  name: 'SuccessMessage',
  backgroundColor: '$primaryMuted',
  borderRadius: '$4',
  padding: '$4',
  alignItems: 'center',
  gap: '$2',
});

const ErrorMessage = styled(YStack, {
  name: 'ErrorMessage',
  backgroundColor: '$dangerMuted',
  borderRadius: '$4',
  padding: '$4',
  alignItems: 'center',
  gap: '$2',
});

export default function BackupScreen(): React.ReactElement {
  const router = useRouter();
  const { stats, status, error, importResult, exportData, importData, resetStatus } = useBackup();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleExport = useCallback(async () => {
    await exportData();
  }, [exportData]);

  const handleImport = useCallback(() => {
    Alert.alert(
      'Import Backup',
      'This will merge the backup data with your existing data. Duplicate accounts will be skipped.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await importData('merge');
          },
        },
      ]
    );
  }, [importData]);

  const handleDismissResult = useCallback(() => {
    resetStatus();
  }, [resetStatus]);

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <Header>
        <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          {({ pressed }) => (
            <BackButton opacity={pressed ? 0.7 : 1}>
              <Text color="$accentPrimary" fontSize="$5">
                ‹
              </Text>
              <Body color="$accentPrimary">Back</Body>
            </BackButton>
          )}
        </Pressable>

        <Heading level="h3">Backup & Restore</Heading>

        <XStack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ContentContainer>
          {status === 'success' && !importResult && (
            <SuccessMessage>
              <Text fontSize="$6">✓</Text>
              <Body color="$accentPrimary" fontWeight="600">
                Export Successful
              </Body>
              <Caption color="$textSecondary" textAlign="center">
                Your backup file has been shared. Save it in a safe location.
              </Caption>
            </SuccessMessage>
          )}

          {status === 'error' && error && !importResult && (
            <ErrorMessage>
              <Text fontSize="$6">!</Text>
              <Body color="$accentDanger" fontWeight="600">
                Error
              </Body>
              <Caption color="$textSecondary" textAlign="center">
                {error}
              </Caption>
            </ErrorMessage>
          )}

          {importResult ? (
            <ImportResultCard result={importResult} onDismiss={handleDismissResult} />
          ) : (
            <BackupCard
              stats={stats.data}
              isLoading={stats.isLoading}
              status={status}
              onExport={handleExport}
              onImport={handleImport}
            />
          )}

          <InfoCard>
            <Body fontWeight="600">About Backups</Body>

            <InfoItem>
              <InfoIcon>
                <Text fontSize="$2">💾</Text>
              </InfoIcon>
              <YStack flex={1}>
                <Body fontSize="$2">JSON Format</Body>
                <Caption color="$textSecondary">
                  Backups are saved as JSON files that you can store anywhere.
                </Caption>
              </YStack>
            </InfoItem>

            <InfoItem>
              <InfoIcon>
                <Text fontSize="$2">🔒</Text>
              </InfoIcon>
              <YStack flex={1}>
                <Body fontSize="$2">Local Storage Only</Body>
                <Caption color="$textSecondary">
                  Your data never leaves your device unless you share the backup.
                </Caption>
              </YStack>
            </InfoItem>

            <InfoItem>
              <InfoIcon>
                <Text fontSize="$2">🔄</Text>
              </InfoIcon>
              <YStack flex={1}>
                <Body fontSize="$2">Smart Merge</Body>
                <Caption color="$textSecondary">
                  Importing skips existing accounts to prevent duplicates.
                </Caption>
              </YStack>
            </InfoItem>
          </InfoCard>
        </ContentContainer>
      </ScrollView>
    </Screen>
  );
}
