import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Body, Caption, Button } from '@/shared/components/ui';

import type { ImportResult } from '../types';

interface ImportResultCardProps {
  result: ImportResult;
  onDismiss: () => void;
}

const CardContainer = styled(YStack, {
  name: 'ImportResultCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$4',
});

const HeaderRow = styled(XStack, {
  name: 'HeaderRow',
  alignItems: 'center',
  gap: '$3',
});

const IconCircle = styled(Stack, {
  name: 'IconCircle',
  width: 48,
  height: 48,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
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
  fontSize: '$4',
  fontWeight: '600',
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

export function ImportResultCard({ result, onDismiss }: ImportResultCardProps): React.ReactElement {
  const totalImported =
    result.imported.accounts + result.imported.transactions + result.imported.categories;

  const totalSkipped =
    result.skipped.accounts + result.skipped.transactions + result.skipped.categories;

  return (
    <CardContainer>
      <HeaderRow>
        <IconCircle backgroundColor={result.success ? '$primaryMuted' : '$dangerMuted'}>
          <Text fontSize="$5">{result.success ? '✓' : '!'}</Text>
        </IconCircle>
        <YStack flex={1}>
          <Body fontWeight="600">
            {result.success ? 'Import Complete' : 'Import Completed with Errors'}
          </Body>
          <Caption color="$textSecondary">
            {totalImported} items imported
            {totalSkipped > 0 && `, ${totalSkipped} skipped`}
          </Caption>
        </YStack>
      </HeaderRow>

      <StatsRow>
        <StatItem>
          <StatValue color="$accentPrimary">{result.imported.accounts}</StatValue>
          <StatLabel>Accounts</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color="$accentPrimary">{result.imported.transactions}</StatValue>
          <StatLabel>Transactions</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue color="$accentPrimary">{result.imported.categories}</StatValue>
          <StatLabel>Categories</StatLabel>
        </StatItem>
      </StatsRow>

      {result.errors.length > 0 && (
        <ErrorList>
          <Caption color="$accentDanger" fontWeight="600">
            Errors ({result.errors.length})
          </Caption>
          {result.errors.slice(0, 3).map((error, index) => (
            <Caption key={index} color="$accentDanger" fontSize="$1">
              • {error}
            </Caption>
          ))}
          {result.errors.length > 3 && (
            <Caption color="$accentDanger" fontSize="$1">
              ...and {result.errors.length - 3} more errors
            </Caption>
          )}
        </ErrorList>
      )}

      <Button onPress={onDismiss} fullWidth>
        Done
      </Button>
    </CardContainer>
  );
}
