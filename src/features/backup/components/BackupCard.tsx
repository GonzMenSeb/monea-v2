import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Body, Caption, Button } from '@/shared/components/ui';

import type { BackupStatus } from '../hooks';
import type { BackupStats } from '../types';

interface BackupCardProps {
  stats: BackupStats | undefined;
  isLoading: boolean;
  status: BackupStatus;
  onExport: () => void;
  onImport: () => void;
}

const CardContainer = styled(YStack, {
  name: 'BackupCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$4',
});

const StatsGrid = styled(XStack, {
  name: 'StatsGrid',
  justifyContent: 'space-around',
});

const StatItem = styled(YStack, {
  name: 'StatItem',
  alignItems: 'center',
});

const StatValue = styled(Text, {
  name: 'StatValue',
  fontSize: '$5',
  fontWeight: '700',
  color: '$textPrimary',
});

const StatLabel = styled(Text, {
  name: 'StatLabel',
  fontSize: '$1',
  color: '$textSecondary',
});

const InfoRow = styled(XStack, {
  name: 'InfoRow',
  alignItems: 'center',
  gap: '$2',
});

const ButtonRow = styled(XStack, {
  name: 'ButtonRow',
  gap: '$3',
});

function formatDateRange(stats: BackupStats): string {
  if (!stats.dateRange.earliest || !stats.dateRange.latest) {
    return 'No transactions';
  }

  const format = (date: Date): string =>
    date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return `${format(stats.dateRange.earliest)} - ${format(stats.dateRange.latest)}`;
}

export function BackupCard({
  stats,
  isLoading,
  status,
  onExport,
  onImport,
}: BackupCardProps): React.ReactElement {
  const isExporting = status === 'exporting';
  const isImporting = status === 'importing';
  const isWorking = isExporting || isImporting;

  return (
    <CardContainer>
      <Body fontWeight="600">Your Data</Body>

      {isLoading ? (
        <YStack alignItems="center" paddingVertical="$4">
          <Caption color="$textSecondary">Loading stats...</Caption>
        </YStack>
      ) : stats ? (
        <>
          <StatsGrid>
            <StatItem>
              <StatValue>{stats.accountCount}</StatValue>
              <StatLabel>Accounts</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.transactionCount}</StatValue>
              <StatLabel>Transactions</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.categoryCount}</StatValue>
              <StatLabel>Categories</StatLabel>
            </StatItem>
          </StatsGrid>

          <YStack gap="$1">
            <InfoRow>
              <Text fontSize="$2">📅</Text>
              <Caption color="$textSecondary">{formatDateRange(stats)}</Caption>
            </InfoRow>
            <InfoRow>
              <Text fontSize="$2">📦</Text>
              <Caption color="$textSecondary">Estimated size: {stats.estimatedSize}</Caption>
            </InfoRow>
          </YStack>
        </>
      ) : null}

      <ButtonRow>
        <Stack flex={1}>
          <Button
            variant="primary"
            onPress={onExport}
            loading={isExporting}
            disabled={isWorking}
            fullWidth
          >
            Export Backup
          </Button>
        </Stack>
        <Stack flex={1}>
          <Button
            variant="outline"
            onPress={onImport}
            loading={isImporting}
            disabled={isWorking}
            fullWidth
          >
            Import Backup
          </Button>
        </Stack>
      </ButtonRow>
    </CardContainer>
  );
}
