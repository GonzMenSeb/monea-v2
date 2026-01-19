import { useCallback, useEffect } from 'react';

import { ScrollView, Pressable } from 'react-native';

import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { useBulkImport, BulkImportCard, ImportProgress, ImportSummary } from '@/features/sms-sync';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Caption, Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

const Header = styled(XStack, {
  name: 'ImportHeader',
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

const PermissionCard = styled(YStack, {
  name: 'PermissionCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$4',
  alignItems: 'center',
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 64,
  height: 64,
  borderRadius: '$full',
  backgroundColor: '$warningMuted',
  alignItems: 'center',
  justifyContent: 'center',
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

export default function ImportScreen(): React.ReactElement {
  const router = useRouter();
  const {
    status,
    progress,
    result,
    error,
    estimatedCount,
    currentLimit,
    canImportMore,
    hasPermission,
    checkPermission,
    requestPermission,
    getEstimatedCount,
    startImport,
    cancelImport,
    reset,
    prepareForMore,
  } = useBulkImport();

  useEffect(() => {
    void checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (hasPermission === true && estimatedCount === null) {
      void getEstimatedCount();
    }
  }, [hasPermission, estimatedCount, getEstimatedCount]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      await getEstimatedCount();
    }
  }, [requestPermission, getEstimatedCount]);

  const handleStartImport = useCallback(() => {
    void startImport();
  }, [startImport]);

  const handleDone = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  const handleViewTransactions = useCallback(() => {
    reset();
    router.replace('/(tabs)/transactions');
  }, [reset, router]);

  const handleImportMore = useCallback(() => {
    prepareForMore();
  }, [prepareForMore]);

  const isImporting = status === 'importing' || status === 'preparing';
  const showProgress = isImporting && progress !== null;
  const showResult = (status === 'complete' || status === 'error') && result !== null;
  const showCard = !showProgress && !showResult && hasPermission;

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
          disabled={isImporting}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          {({ pressed }) => (
            <BackButton opacity={pressed && !isImporting ? 0.7 : isImporting ? 0.3 : 1}>
              <Text color="$accentPrimary" fontSize="$5">
                ‹
              </Text>
              <Body color="$accentPrimary">Back</Body>
            </BackButton>
          )}
        </Pressable>

        <Heading level="h3">Import SMS</Heading>

        <XStack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        scrollEnabled={!isImporting}
      >
        <ContentContainer>
          {hasPermission === false && (
            <PermissionCard>
              <IconContainer>
                <Text fontSize="$6">📱</Text>
              </IconContainer>
              <YStack alignItems="center" gap="$2">
                <Body fontWeight="600" textAlign="center">
                  SMS Permission Required
                </Body>
                <Caption color="$textSecondary" textAlign="center">
                  To import historical transactions, Monea needs permission to read your SMS
                  messages.
                </Caption>
              </YStack>
              <Button onPress={handleRequestPermission} fullWidth>
                Grant Permission
              </Button>
            </PermissionCard>
          )}

          {showProgress && progress && (
            <ImportProgress progress={progress} onCancel={cancelImport} />
          )}

          {showResult && result && (
            <ImportSummary
              result={result}
              canImportMore={canImportMore}
              onImportMore={handleImportMore}
              onDone={handleDone}
              onViewTransactions={handleViewTransactions}
            />
          )}

          {showCard && (
            <BulkImportCard
              estimatedCount={estimatedCount}
              importLimit={currentLimit}
              isLoading={status === 'preparing' || status === 'checking'}
              onStartImport={handleStartImport}
            />
          )}

          {hasPermission && !showProgress && !showResult && (
            <InfoCard>
              <Body fontWeight="600">How it works</Body>

              <InfoItem>
                <InfoIcon>
                  <Text fontSize="$2">1️⃣</Text>
                </InfoIcon>
                <YStack flex={1}>
                  <Body fontSize="$2">Scan Inbox</Body>
                  <Caption color="$textSecondary">
                    We scan your SMS inbox for messages from Colombian banks.
                  </Caption>
                </YStack>
              </InfoItem>

              <InfoItem>
                <InfoIcon>
                  <Text fontSize="$2">2️⃣</Text>
                </InfoIcon>
                <YStack flex={1}>
                  <Body fontSize="$2">Parse Transactions</Body>
                  <Caption color="$textSecondary">
                    Bank messages are automatically parsed to extract transaction details.
                  </Caption>
                </YStack>
              </InfoItem>

              <InfoItem>
                <InfoIcon>
                  <Text fontSize="$2">3️⃣</Text>
                </InfoIcon>
                <YStack flex={1}>
                  <Body fontSize="$2">Skip Duplicates</Body>
                  <Caption color="$textSecondary">
                    Messages already imported are automatically skipped.
                  </Caption>
                </YStack>
              </InfoItem>
            </InfoCard>
          )}
        </ContentContainer>
      </ScrollView>
    </Screen>
  );
}
