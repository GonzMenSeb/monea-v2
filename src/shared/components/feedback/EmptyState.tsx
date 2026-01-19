import { styled, Stack, Text, YStack } from 'tamagui';

import { Button } from '../ui/Button';

type EmptyStateVariant = 'default' | 'transactions' | 'accounts' | 'search';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

const VARIANT_DEFAULTS: Record<EmptyStateVariant, { title: string; description: string }> = {
  default: {
    title: 'Nothing here yet',
    description: 'Get started by adding your first item.',
  },
  transactions: {
    title: 'No transactions found',
    description: 'Your transactions will appear here once Monea reads your bank SMS messages.',
  },
  accounts: {
    title: 'No accounts linked',
    description: 'Link your bank accounts to start tracking your transactions.',
  },
  search: {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
};

const EmptyContainer = styled(YStack, {
  name: 'EmptyContainer',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$8',
  paddingVertical: '$12',
});

const IconContainer = styled(Stack, {
  name: 'EmptyIconContainer',
  width: 64,
  height: 64,
  borderRadius: '$full',
  backgroundColor: '$backgroundElevated',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$4',
});

const EmptyTitle = styled(Text, {
  name: 'EmptyTitle',
  color: '$textPrimary',
  fontSize: '$4',
  fontWeight: '600',
  textAlign: 'center',
});

const EmptyDescription = styled(Text, {
  name: 'EmptyDescription',
  color: '$textSecondary',
  fontSize: '$2',
  textAlign: 'center',
  marginTop: '$2',
  maxWidth: 280,
});

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  const defaults = VARIANT_DEFAULTS[variant];
  const displayTitle = title || defaults.title;
  const displayDescription = description ?? defaults.description;

  return (
    <EmptyContainer>
      {icon && <IconContainer>{icon}</IconContainer>}
      <EmptyTitle>{displayTitle}</EmptyTitle>
      {displayDescription && <EmptyDescription>{displayDescription}</EmptyDescription>}
      {actionLabel && onAction && (
        <Stack marginTop="$6">
          <Button variant="primary" size="md" onPress={onAction}>
            {actionLabel}
          </Button>
        </Stack>
      )}
    </EmptyContainer>
  );
}
