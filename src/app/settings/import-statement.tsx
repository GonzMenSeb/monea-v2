import { useCallback, useState } from 'react';

import { ScrollView, Pressable, Alert } from 'react-native';

import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { BANK_INFO } from '@/core/parser';
import {
  StatementFilePicker,
  ImportProgressCard,
  ImportResultCard,
  PasswordPrompt,
  useStatementImport,
} from '@/features/statement-import';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Caption, Button } from '@/shared/components/ui';
import { useHaptics } from '@/shared/hooks/useHaptics';
import { colors } from '@/shared/theme';

import type { SelectedFile, FileImportInput } from '@/features/statement-import';
import type { BankCode } from '@/infrastructure/database/models/Account';

interface PendingImport {
  file: SelectedFile;
  data: Buffer;
  requiresPassword: boolean;
}

const Header = styled(XStack, {
  name: 'ImportStatementHeader',
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

const BankDetectedCard = styled(YStack, {
  name: 'BankDetectedCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$3',
});

const BankBadge = styled(XStack, {
  name: 'BankBadge',
  backgroundColor: '$primaryMuted',
  borderRadius: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  alignSelf: 'flex-start',
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

const ActionButtons = styled(XStack, {
  name: 'ActionButtons',
  gap: '$3',
});

type ScreenStatus = 'idle' | 'file_selected' | 'importing' | 'complete' | 'error';

export default function ImportStatementScreen(): React.ReactElement {
  const router = useRouter();
  const { light, success: hapticSuccess, error: hapticError } = useHaptics();

  const {
    status: importStatus,
    progress,
    result,
    error: importError,
    isImporting,
    importStatement,
    reset,
  } = useStatementImport();

  const [screenStatus, setScreenStatus] = useState<ScreenStatus>('idle');
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [detectedBank, setDetectedBank] = useState<BankCode | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [isProcessingPassword, setIsProcessingPassword] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const detectBankFromFile = useCallback((file: SelectedFile): BankCode | null => {
    const fileName = file.name.toLowerCase();

    if (fileName.includes('bancolombia') || fileName.includes('cuentas de ahorro')) {
      return 'bancolombia';
    }
    if (fileName.includes('nequi')) {
      return 'nequi';
    }
    if (fileName.includes('davivienda') || fileName.includes('daviplata')) {
      return 'davivienda';
    }
    if (fileName.includes('bbva')) {
      return 'bbva';
    }

    return null;
  }, []);

  const handleFileSelected = useCallback(
    (file: SelectedFile, data: Buffer) => {
      const bank = detectBankFromFile(file);
      setDetectedBank(bank);

      const isPdf = file.fileType === 'pdf';
      const requiresPassword = isPdf;

      setPendingImport({ file, data, requiresPassword });
      setScreenStatus('file_selected');

      if (requiresPassword) {
        setShowPasswordPrompt(true);
        setPasswordError(undefined);
      }
    },
    [detectBankFromFile]
  );

  const handleFileError = useCallback(
    (errorMessage: string) => {
      hapticError();
      Alert.alert('File Error', errorMessage);
    },
    [hapticError]
  );

  const performImport = useCallback(
    async (password?: string) => {
      if (!pendingImport) {
        return;
      }

      const input: FileImportInput = {
        data: pendingImport.data,
        fileName: pendingImport.file.name,
        fileType: pendingImport.file.fileType,
        password,
        bankCode: detectedBank ?? undefined,
      };

      setScreenStatus('importing');

      try {
        const importResult = await importStatement(input);

        if (importResult) {
          setScreenStatus('complete');
          if (importResult.success) {
            hapticSuccess();
          } else {
            hapticError();
          }
        }
      } catch {
        setScreenStatus('error');
        hapticError();
      }
    },
    [pendingImport, detectedBank, importStatement, hapticSuccess, hapticError]
  );

  const handleImportWithoutPassword = useCallback(() => {
    if (!pendingImport || pendingImport.file.fileType === 'pdf') {
      return;
    }
    light();
    void performImport();
  }, [pendingImport, light, performImport]);

  const handlePasswordSubmit = useCallback(
    async (password: string) => {
      setIsProcessingPassword(true);
      setPasswordError(undefined);

      try {
        await performImport(password);
        setShowPasswordPrompt(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to unlock PDF';

        if (
          errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('decrypt')
        ) {
          setPasswordError('Incorrect password. Please try again.');
          setScreenStatus('file_selected');
        } else {
          setPasswordError(errorMessage);
        }
      } finally {
        setIsProcessingPassword(false);
      }
    },
    [performImport]
  );

  const handlePasswordCancel = useCallback(() => {
    light();
    setShowPasswordPrompt(false);
    setPasswordError(undefined);
    setPendingImport(null);
    setDetectedBank(null);
    setScreenStatus('idle');
  }, [light]);

  const handleStartOver = useCallback(() => {
    light();
    reset();
    setPendingImport(null);
    setDetectedBank(null);
    setScreenStatus('idle');
  }, [light, reset]);

  const handleViewTransactions = useCallback(() => {
    router.replace('/(tabs)/transactions');
  }, [router]);

  const renderContent = (): React.ReactElement => {
    if (screenStatus === 'importing' && progress) {
      return (
        <ImportProgressCard
          progress={progress}
          transactionsCount={progress.phase === 'importing' ? progress.currentStep : undefined}
        />
      );
    }

    if (screenStatus === 'complete' && result) {
      return (
        <YStack gap="$4">
          <ImportResultCard result={result} />
          <ActionButtons>
            <Button variant="outline" onPress={handleStartOver} fullWidth>
              Import Another
            </Button>
            {result.success && result.transactions.imported > 0 && (
              <Button onPress={handleViewTransactions} fullWidth>
                View Transactions
              </Button>
            )}
          </ActionButtons>
        </YStack>
      );
    }

    if (screenStatus === 'error' || importStatus === 'error') {
      return (
        <YStack gap="$4">
          <ErrorMessage>
            <Text fontSize="$6">❌</Text>
            <Body color="$accentDanger" fontWeight="600">
              Import Failed
            </Body>
            <Caption color="$textSecondary" textAlign="center">
              {importError ?? 'An unexpected error occurred'}
            </Caption>
          </ErrorMessage>
          <Button variant="outline" onPress={handleStartOver} fullWidth>
            Try Again
          </Button>
        </YStack>
      );
    }

    return (
      <YStack gap="$4">
        <StatementFilePicker
          onFileSelected={handleFileSelected}
          onError={handleFileError}
          disabled={isImporting}
          loading={isImporting}
        />

        {screenStatus === 'file_selected' && pendingImport && (
          <>
            {detectedBank && (
              <BankDetectedCard>
                <Body fontWeight="600">Bank Detected</Body>
                <BankBadge>
                  <Text fontSize="$3">🏦</Text>
                  <Body fontWeight="500" color="$accentPrimary">
                    {BANK_INFO[detectedBank]?.name ?? detectedBank.toUpperCase()}
                  </Body>
                </BankBadge>
                <Caption color="$textSecondary">
                  The statement format was recognized as{' '}
                  {BANK_INFO[detectedBank]?.name ?? detectedBank}.
                </Caption>
              </BankDetectedCard>
            )}

            {!pendingImport.requiresPassword && (
              <Button onPress={handleImportWithoutPassword} disabled={isImporting} fullWidth>
                Import Statement
              </Button>
            )}

            {pendingImport.requiresPassword && !showPasswordPrompt && (
              <Button
                onPress={() => {
                  setShowPasswordPrompt(true);
                  setPasswordError(undefined);
                }}
                disabled={isImporting}
                fullWidth
              >
                Enter PDF Password
              </Button>
            )}
          </>
        )}
      </YStack>
    );
  };

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

        <Heading level="h3">Import Statement</Heading>

        <XStack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ContentContainer>
          {renderContent()}

          {screenStatus === 'idle' && (
            <InfoCard>
              <Body fontWeight="600">About Bank Statements</Body>

              <InfoItem>
                <InfoIcon>
                  <Text fontSize="$2">📄</Text>
                </InfoIcon>
                <YStack flex={1}>
                  <Body fontSize="$2">Supported Formats</Body>
                  <Caption color="$textSecondary">
                    PDF statements (Nequi) and Excel files (Bancolombia).
                  </Caption>
                </YStack>
              </InfoItem>

              <InfoItem>
                <InfoIcon>
                  <Text fontSize="$2">🔒</Text>
                </InfoIcon>
                <YStack flex={1}>
                  <Body fontSize="$2">Password Protected</Body>
                  <Caption color="$textSecondary">
                    Some bank PDFs require a password. You&apos;ll be prompted to enter it.
                  </Caption>
                </YStack>
              </InfoItem>

              <InfoItem>
                <InfoIcon>
                  <Text fontSize="$2">✅</Text>
                </InfoIcon>
                <YStack flex={1}>
                  <Body fontSize="$2">Accurate Balances</Body>
                  <Caption color="$textSecondary">
                    Statement balances are authoritative and update your account balance.
                  </Caption>
                </YStack>
              </InfoItem>

              <InfoItem>
                <InfoIcon>
                  <Text fontSize="$2">🔍</Text>
                </InfoIcon>
                <YStack flex={1}>
                  <Body fontSize="$2">Duplicate Detection</Body>
                  <Caption color="$textSecondary">
                    Existing transactions are detected and skipped automatically.
                  </Caption>
                </YStack>
              </InfoItem>
            </InfoCard>
          )}
        </ContentContainer>
      </ScrollView>

      <PasswordPrompt
        visible={showPasswordPrompt}
        fileName={pendingImport?.file.name}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
        loading={isProcessingPassword || isImporting}
        errorMessage={passwordError}
      />
    </Screen>
  );
}
