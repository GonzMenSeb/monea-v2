import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styled, Stack, Text, YStack } from 'tamagui';

import { colors } from '@/shared/theme';

import { Button } from '../ui/Button';

type ErrorStateVariant = 'default' | 'network' | 'permission' | 'empty' | 'server';

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

interface VariantConfig {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
}

const VARIANT_CONFIG: Record<ErrorStateVariant, VariantConfig> = {
  default: {
    icon: 'alert-circle-outline',
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
  network: {
    icon: 'wifi-off',
    title: 'No internet connection',
    message: 'Check your connection and try again.',
  },
  permission: {
    icon: 'lock-outline',
    title: 'Permission required',
    message: 'This feature requires additional permissions to work properly.',
  },
  empty: {
    icon: 'database-off-outline',
    title: 'No data available',
    message: 'There is no data to display at the moment.',
  },
  server: {
    icon: 'server-off',
    title: 'Server error',
    message: 'Our servers are having trouble. Please try again later.',
  },
};

const Container = styled(YStack, {
  name: 'Container',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$8',
  paddingVertical: 48,
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 80,
  height: 80,
  borderRadius: '$full',
  backgroundColor: '$dangerMuted',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$6',
});

const Title = styled(Text, {
  name: 'Title',
  fontSize: '$5',
  fontWeight: '700',
  color: '$textPrimary',
  textAlign: 'center',
});

const Message = styled(Text, {
  name: 'Message',
  fontSize: '$2',
  color: '$textSecondary',
  textAlign: 'center',
  marginTop: '$3',
  maxWidth: 280,
});

const ActionsContainer = styled(YStack, {
  name: 'ActionsContainer',
  marginTop: '$8',
  alignItems: 'center',
  gap: '$3',
});

const DEFAULT_RETRY_LABEL = 'Try Again';

export function ErrorState({
  variant = 'default',
  title,
  message,
  retryLabel,
  onRetry,
  secondaryActionLabel,
  onSecondaryAction,
}: ErrorStateProps): React.ReactElement {
  const config = VARIANT_CONFIG[variant];
  const displayTitle = title ?? config.title;
  const displayMessage = message ?? config.message;
  const displayRetryLabel = retryLabel ?? DEFAULT_RETRY_LABEL;

  return (
    <Container>
      <IconContainer>
        <MaterialCommunityIcons name={config.icon} size={40} color={colors.accent.danger} />
      </IconContainer>
      <Title>{displayTitle}</Title>
      <Message>{displayMessage}</Message>
      {(onRetry ?? onSecondaryAction) && (
        <ActionsContainer>
          {onRetry && (
            <Button variant="primary" size="md" onPress={onRetry}>
              {displayRetryLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="md" onPress={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </ActionsContainer>
      )}
    </Container>
  );
}
