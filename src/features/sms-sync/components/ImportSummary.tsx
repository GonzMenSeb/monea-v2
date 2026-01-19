import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Body, Caption, Button } from '@/shared/components/ui';

import type { BulkImportResult } from '../services';

interface ImportSummaryProps {
  result: BulkImportResult;
  onDone: () => void;
  onViewTransactions: () => void;
}

const CardContainer = styled(YStack, {
  name: 'ImportSummaryCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$4',
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 64,
  height: 64,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
});

const StatsRow = styled(XStack, {
  name: 'StatsRow',
  justifyContent: 'space-around',
  paddingVertical: '$2',
});

const StatItem = styled(YStack, {
  name: 'StatItem',
  alignItems: 'center',
});

const StatValue = styled(Text, {
  name: 'StatValue',
  fontSize: '$5',
  fontWeight: '700',
});

const StatLabel = styled(Text, {
  name: 'StatLabel',
  fontSize: '$1',
  color: '$textSecondary',
});

const ErrorList = styled(YStack, {
  name: 'ErrorList',
  backgroundColor: '$dangerMuted',
  borderRadius: '$3',
  padding: '$3',
  gap: '$1',
});

const ButtonRow = styled(XStack, {
  name: 'ButtonRow',
  gap: '$3',
});

export function ImportSummary({
  result,
  onDone,
  onViewTransactions,
}: ImportSummaryProps): React.ReactElement {
  const hasErrors = result.errors > 0;
  const hasImported = result.imported > 0;

  return (
    <CardContainer>
      <IconContainer backgroundColor={hasErrors && !hasImported ? '$dangerMuted' : '$primaryMuted'}>
        <Text fontSize="$7">{hasErrors && !hasImported ? '!' : '✓'}</Text>
      </IconContainer>

      <YStack alignItems="center" gap="$2">
        <Body fontWeight="600" textAlign="center">
          {hasErrors && !hasImported
            ? 'Import Failed'
            : hasErrors
              ? 'Import Completed with Errors'
              : 'Import Successful'}
        </Body>
        <Caption color="$textSecondary" textAlign="center">
          {hasImported
            ? `${result.imported} new transaction${result.imported !== 1 ? 's' : ''} imported`
            : 'No new transactions found'}
        </Caption>
      </YStack>

      <StatsRow>
        <StatItem>
          <StatValue color="$accentPrimary">{result.imported}</StatValue>
          <StatLabel>Imported</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color="$textSecondary">{result.duplicates}</StatValue>
          <StatLabel>Duplicates</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color={hasErrors ? '$accentDanger' : '$textSecondary'}>
            {result.errors}
          </StatValue>
          <StatLabel>Errors</StatLabel>
        </StatItem>
      </StatsRow>

      {hasErrors && result.errorMessages.length > 0 && (
        <ErrorList>
          <Caption color="$accentDanger" fontWeight="600">
            Errors ({result.errorMessages.length})
          </Caption>
          {result.errorMessages.slice(0, 3).map((error, index) => (
            <Caption key={index} color="$accentDanger" fontSize="$1">
              • {error}
            </Caption>
          ))}
          {result.errorMessages.length > 3 && (
            <Caption color="$accentDanger" fontSize="$1">
              ...and {result.errorMessages.length - 3} more errors
            </Caption>
          )}
        </ErrorList>
      )}

      <ButtonRow>
        <Stack flex={1}>
          <Button variant="ghost" onPress={onDone} fullWidth>
            Done
          </Button>
        </Stack>
        {hasImported && (
          <Stack flex={1}>
            <Button onPress={onViewTransactions} fullWidth>
              View Transactions
            </Button>
          </Stack>
        )}
      </ButtonRow>
    </CardContainer>
  );
}
