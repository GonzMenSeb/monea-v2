import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Body, Caption, Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { BulkImportProgress } from '../services';

interface ImportProgressProps {
  progress: BulkImportProgress;
  onCancel: () => void;
}

const CardContainer = styled(YStack, {
  name: 'ImportProgressCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$4',
});

const ProgressBarContainer = styled(Stack, {
  name: 'ProgressBarContainer',
  height: 8,
  backgroundColor: '$backgroundElevated',
  borderRadius: '$full',
  overflow: 'hidden',
});

const ProgressBarFill = styled(Stack, {
  name: 'ProgressBarFill',
  height: '100%',
  backgroundColor: '$accentPrimary',
  borderRadius: '$full',
});

const StatsRow = styled(XStack, {
  name: 'StatsRow',
  justifyContent: 'space-around',
});

const StatItem = styled(YStack, {
  name: 'StatItem',
  alignItems: 'center',
});

const StatValue = styled(Text, {
  name: 'StatValue',
  fontSize: '$4',
  fontWeight: '600',
});

const StatLabel = styled(Text, {
  name: 'StatLabel',
  fontSize: '$1',
  color: '$textSecondary',
});

export function ImportProgress({ progress, onCancel }: ImportProgressProps): React.ReactElement {
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const phaseLabels: Record<BulkImportProgress['phase'], string> = {
    preparing: 'Preparing...',
    importing: 'Importing messages...',
    complete: 'Import complete!',
  };

  return (
    <CardContainer>
      <YStack alignItems="center" gap="$2">
        <Body fontWeight="600">{phaseLabels[progress.phase]}</Body>
        {progress.phase !== 'complete' && (
          <Caption color="$textSecondary">
            {progress.current.toLocaleString()} of {progress.total.toLocaleString()} messages
          </Caption>
        )}
      </YStack>

      <ProgressBarContainer>
        <ProgressBarFill style={{ width: `${progressPercent}%` }} />
      </ProgressBarContainer>

      <StatsRow>
        <StatItem>
          <StatValue color="$accentPrimary">{progress.newTransactions}</StatValue>
          <StatLabel>Imported</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color="$textSecondary">{progress.duplicates}</StatValue>
          <StatLabel>Skipped</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color="$accentDanger">{progress.errors}</StatValue>
          <StatLabel>Errors</StatLabel>
        </StatItem>
      </StatsRow>

      {progress.phase !== 'complete' && (
        <Button variant="ghost" onPress={onCancel}>
          Cancel
        </Button>
      )}
    </CardContainer>
  );
}
