import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Body, Caption, Button } from '@/shared/components/ui';

interface BulkImportCardProps {
  estimatedCount: number | null;
  importLimit: number;
  isLoading: boolean;
  onStartImport: () => void;
}

const CardContainer = styled(YStack, {
  name: 'BulkImportCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$4',
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 56,
  height: 56,
  borderRadius: '$full',
  backgroundColor: '$primaryMuted',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
});

const CountBadge = styled(XStack, {
  name: 'CountBadge',
  backgroundColor: '$backgroundElevated',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
});

export function BulkImportCard({
  estimatedCount,
  importLimit,
  isLoading,
  onStartImport,
}: BulkImportCardProps): React.ReactElement {
  const effectiveLimit =
    estimatedCount !== null ? Math.min(importLimit, estimatedCount) : importLimit;

  return (
    <CardContainer>
      <IconContainer>
        <Text fontSize="$6">📥</Text>
      </IconContainer>

      <YStack alignItems="center" gap="$2">
        <Body fontWeight="600" textAlign="center">
          Import Historical SMS
        </Body>
        <Caption color="$textSecondary" textAlign="center">
          Scan your inbox for bank transaction messages and import them automatically.
        </Caption>
      </YStack>

      {estimatedCount !== null && (
        <CountBadge>
          <Text color="$accentPrimary" fontWeight="600" fontSize="$4">
            {effectiveLimit.toLocaleString()}
          </Text>
          <Caption color="$textSecondary" marginLeft="$2">
            of {estimatedCount.toLocaleString()} messages
          </Caption>
        </CountBadge>
      )}

      <Button
        onPress={onStartImport}
        loading={isLoading}
        disabled={isLoading || estimatedCount === 0}
        fullWidth
      >
        {isLoading ? 'Scanning...' : `Import ${effectiveLimit.toLocaleString()} Messages`}
      </Button>
    </CardContainer>
  );
}
