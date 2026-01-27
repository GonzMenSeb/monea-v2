import { useMemo } from 'react';

import { styled, Stack, Text, YStack, XStack } from 'tamagui';

import { Body, Caption, Heading } from '@/shared/components/ui';
import { colors } from '@/shared/theme';
import { formatCurrency, formatDateShort } from '@/shared/utils/formatting';

import type { ImportResult, PeriodOverlapInfo, ImportError } from '../types';

interface ImportResultCardProps {
  result: ImportResult;
  onDismiss?: () => void;
}

const CardContainer = styled(YStack, {
  name: 'ImportResultCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  overflow: 'hidden',
});

const StatusBanner = styled(XStack, {
  name: 'StatusBanner',
  padding: '$4',
  alignItems: 'center',
  gap: '$3',

  variants: {
    status: {
      success: {
        backgroundColor: 'rgba(0, 212, 170, 0.15)',
      },
      error: {
        backgroundColor: 'rgba(255, 71, 87, 0.15)',
      },
      partial: {
        backgroundColor: 'rgba(255, 184, 0, 0.15)',
      },
    },
  } as const,
});

const StatusIconContainer = styled(Stack, {
  name: 'StatusIconContainer',
  width: 48,
  height: 48,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    status: {
      success: {
        backgroundColor: colors.accent.primary,
      },
      error: {
        backgroundColor: colors.accent.danger,
      },
      partial: {
        backgroundColor: colors.accent.warning,
      },
    },
  } as const,
});

const ContentSection = styled(YStack, {
  name: 'ContentSection',
  padding: '$4',
  gap: '$4',
});

const StatsGrid = styled(XStack, {
  name: 'StatsGrid',
  flexWrap: 'wrap',
  gap: '$3',
});

const StatBox = styled(YStack, {
  name: 'StatBox',
  backgroundColor: '$backgroundElevated',
  borderRadius: '$3',
  padding: '$3',
  minWidth: 80,
  flex: 1,
  alignItems: 'center',
});

const Divider = styled(Stack, {
  name: 'Divider',
  height: 1,
  backgroundColor: '$border',
  marginVertical: '$2',
});

const AccountSection = styled(YStack, {
  name: 'AccountSection',
  backgroundColor: '$backgroundElevated',
  borderRadius: '$3',
  padding: '$3',
  gap: '$2',
});

const BalanceRow = styled(XStack, {
  name: 'BalanceRow',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const WarningBox = styled(YStack, {
  name: 'WarningBox',
  backgroundColor: 'rgba(255, 184, 0, 0.1)',
  borderRadius: '$3',
  padding: '$3',
  borderLeftWidth: 3,
  borderLeftColor: colors.accent.warning,
  gap: '$1',
});

const ErrorBox = styled(YStack, {
  name: 'ErrorBox',
  backgroundColor: 'rgba(255, 71, 87, 0.1)',
  borderRadius: '$3',
  padding: '$3',
  borderLeftWidth: 3,
  borderLeftColor: colors.accent.danger,
  gap: '$1',
});

const PeriodBadge = styled(XStack, {
  name: 'PeriodBadge',
  backgroundColor: '$backgroundElevated',
  borderRadius: '$2',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  alignSelf: 'flex-start',
  gap: '$1',
});

type ResultStatus = 'success' | 'error' | 'partial';

function getResultStatus(result: ImportResult): ResultStatus {
  if (!result.success) {
    return 'error';
  }
  if (result.transactions.skipped > 0 || result.errors.length > 0) {
    return 'partial';
  }
  return 'success';
}

function getStatusConfig(status: ResultStatus): { icon: string; title: string; color: string } {
  switch (status) {
    case 'success':
      return { icon: '✅', title: 'Import Complete', color: colors.accent.primary };
    case 'error':
      return { icon: '❌', title: 'Import Failed', color: colors.accent.danger };
    case 'partial':
      return { icon: '⚠️', title: 'Import Complete with Warnings', color: colors.accent.warning };
  }
}

function formatPeriodOverlap(overlap: PeriodOverlapInfo): string {
  return `Overlaps ${overlap.overlapDays} days with "${overlap.fileName}"`;
}

function formatImportError(error: ImportError): string {
  if (error.transactionIndex !== undefined && error.amount !== undefined) {
    return `Row ${error.transactionIndex + 1}: ${error.message} (${formatCurrency(error.amount)})`;
  }
  if (error.transactionIndex !== undefined) {
    return `Row ${error.transactionIndex + 1}: ${error.message}`;
  }
  return error.message;
}

function StatItem({
  label,
  value,
  color,
  testID,
}: {
  label: string;
  value: number | string;
  color?: string;
  testID?: string;
}): React.ReactElement {
  return (
    <StatBox>
      <Caption color="$textMuted">{label}</Caption>
      <Body fontWeight="700" fontFamily="$mono" color={color ?? '$textPrimary'} testID={testID}>
        {value}
      </Body>
    </StatBox>
  );
}

export function ImportResultCard({ result }: ImportResultCardProps): React.ReactElement {
  const status = useMemo(() => getResultStatus(result), [result]);
  const statusConfig = useMemo(() => getStatusConfig(status), [status]);

  const hasWarnings = result.periodOverlaps.length > 0 || result.duplicates.length > 0;
  const hasErrors = result.errors.length > 0;

  const balanceChange = useMemo(() => {
    if (!result.account || result.account.previousBalance === undefined) {
      return null;
    }
    return result.account.newBalance - result.account.previousBalance;
  }, [result.account]);

  return (
    <CardContainer
      testID="import-result-card"
      accessibilityRole="summary"
      accessibilityLabel={`Import result: ${statusConfig.title}`}
    >
      <StatusBanner status={status}>
        <StatusIconContainer status={status}>
          <Text fontSize="$5">{statusConfig.icon}</Text>
        </StatusIconContainer>
        <YStack flex={1}>
          <Heading level="h4" color={statusConfig.color}>
            {statusConfig.title}
          </Heading>
          <Caption color="$textSecondary">
            {result.bankCode.toUpperCase()} • {result.transactions.imported} transactions imported
          </Caption>
        </YStack>
      </StatusBanner>

      <ContentSection>
        <YStack gap="$2">
          <Body fontWeight="600" color="$textPrimary">
            Transaction Summary
          </Body>
          <StatsGrid>
            <StatItem label="Total" value={result.transactions.total} testID="stat-total" />
            <StatItem
              label="Imported"
              value={result.transactions.imported}
              color={colors.accent.primary}
              testID="stat-imported"
            />
            <StatItem
              label="Duplicates"
              value={result.transactions.duplicates}
              color={result.transactions.duplicates > 0 ? colors.accent.warning : colors.text.muted}
              testID="stat-duplicates"
            />
            <StatItem
              label="Skipped"
              value={result.transactions.skipped}
              color={result.transactions.skipped > 0 ? colors.accent.danger : colors.text.muted}
              testID="stat-skipped"
            />
          </StatsGrid>
        </YStack>

        <PeriodBadge>
          <Caption color="$textMuted">📅</Caption>
          <Caption color="$textSecondary" testID="period-range">
            {formatDateShort(result.periodStart)} — {formatDateShort(result.periodEnd)}
          </Caption>
        </PeriodBadge>

        {result.account && (
          <>
            <Divider />
            <AccountSection>
              <XStack justifyContent="space-between" alignItems="center">
                <Body fontWeight="600" color="$textPrimary">
                  Account Updated
                </Body>
                <Caption color="$textMuted">****{result.account.accountNumber.slice(-4)}</Caption>
              </XStack>

              {result.account.previousBalance !== undefined && (
                <BalanceRow>
                  <Caption color="$textMuted">Previous Balance</Caption>
                  <Body fontFamily="$mono" color="$textSecondary">
                    {formatCurrency(result.account.previousBalance)}
                  </Body>
                </BalanceRow>
              )}

              <BalanceRow>
                <Caption color="$textMuted">New Balance</Caption>
                <Body fontWeight="700" fontFamily="$mono" color="$textPrimary" testID="new-balance">
                  {formatCurrency(result.account.newBalance)}
                </Body>
              </BalanceRow>

              {balanceChange !== null && (
                <BalanceRow>
                  <Caption color="$textMuted">Change</Caption>
                  <Body
                    fontWeight="600"
                    fontFamily="$mono"
                    color={balanceChange >= 0 ? '$accentPrimary' : '$accentDanger'}
                    testID="balance-change"
                  >
                    {balanceChange >= 0 ? '+' : ''}
                    {formatCurrency(balanceChange)}
                  </Body>
                </BalanceRow>
              )}
            </AccountSection>
          </>
        )}

        {hasWarnings && (
          <>
            <Divider />
            <YStack gap="$2">
              {result.periodOverlaps.length > 0 && (
                <WarningBox>
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize="$3">⚠️</Text>
                    <Body fontWeight="600" color={colors.accent.warning}>
                      Period Overlaps
                    </Body>
                  </XStack>
                  {result.periodOverlaps.map((overlap, index) => (
                    <Caption key={`overlap-${index}`} color="$textSecondary">
                      {formatPeriodOverlap(overlap)}
                    </Caption>
                  ))}
                </WarningBox>
              )}

              {result.duplicates.length > 0 && (
                <WarningBox testID="duplicates-warning">
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize="$3">🔄</Text>
                    <Body fontWeight="600" color={colors.accent.warning}>
                      Duplicates Skipped
                    </Body>
                  </XStack>
                  <Caption color="$textSecondary">
                    {result.duplicates.length} duplicate transaction
                    {result.duplicates.length !== 1 ? 's' : ''} were detected and skipped
                  </Caption>
                </WarningBox>
              )}
            </YStack>
          </>
        )}

        {hasErrors && (
          <>
            <Divider />
            <YStack gap="$2">
              <ErrorBox testID="errors-section">
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$3">❌</Text>
                  <Body fontWeight="600" color={colors.accent.danger}>
                    Errors ({result.errors.length})
                  </Body>
                </XStack>
                {result.errors.slice(0, 5).map((error, index) => (
                  <Caption key={`error-${index}`} color="$textSecondary">
                    {formatImportError(error)}
                  </Caption>
                ))}
                {result.errors.length > 5 && (
                  <Caption color="$textMuted">
                    ... and {result.errors.length - 5} more error
                    {result.errors.length - 5 !== 1 ? 's' : ''}
                  </Caption>
                )}
              </ErrorBox>
            </YStack>
          </>
        )}

        {result.reconciliation && (
          <>
            <Divider />
            <YStack gap="$2">
              <Body fontWeight="600" color="$textPrimary">
                Balance Reconciliation
              </Body>
              {result.reconciliation.success ? (
                <XStack
                  backgroundColor="rgba(0, 212, 170, 0.1)"
                  borderRadius="$3"
                  padding="$3"
                  alignItems="center"
                  gap="$2"
                >
                  <Text fontSize="$3">✓</Text>
                  <Caption color="$textSecondary">
                    Balance reconciled from{' '}
                    {result.reconciliation.result?.balanceSource.replace('_', ' ')}
                  </Caption>
                </XStack>
              ) : (
                <ErrorBox testID="reconciliation-error">
                  <Caption color="$textSecondary">
                    {result.reconciliation.errors[0]?.message ?? 'Reconciliation failed'}
                  </Caption>
                </ErrorBox>
              )}

              {result.reconciliation.warnings.length > 0 && (
                <WarningBox testID="reconciliation-warnings">
                  {result.reconciliation.warnings.map((warning, index) => (
                    <Caption key={`warning-${index}`} color="$textSecondary">
                      {warning.message}
                    </Caption>
                  ))}
                </WarningBox>
              )}
            </YStack>
          </>
        )}
      </ContentSection>
    </CardContainer>
  );
}

export type { ImportResultCardProps };
