import { Text, View } from 'react-native';

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

const CONTAINER_STYLES = 'flex-1 items-center justify-center px-8 py-12';
const ICON_CONTAINER_STYLES =
  'w-16 h-16 rounded-full bg-background-tertiary items-center justify-center mb-4';
const TITLE_STYLES = 'text-lg font-semibold text-text-primary text-center';
const DESCRIPTION_STYLES = 'text-sm text-text-secondary text-center mt-2 max-w-xs';
const ACTION_CONTAINER_STYLES = 'mt-6';

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
    <View className={CONTAINER_STYLES}>
      {icon && <View className={ICON_CONTAINER_STYLES}>{icon}</View>}
      <Text className={TITLE_STYLES}>{displayTitle}</Text>
      {displayDescription && <Text className={DESCRIPTION_STYLES}>{displayDescription}</Text>}
      {actionLabel && onAction && (
        <View className={ACTION_CONTAINER_STYLES}>
          <Button variant="primary" size="md" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}
