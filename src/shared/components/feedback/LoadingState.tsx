import { ActivityIndicator } from 'react-native';

import { styled, Stack, Text, XStack } from 'tamagui';

import { colors } from '@/shared/theme';

type LoadingStateSize = 'sm' | 'md' | 'lg';
type LoadingStateVariant = 'default' | 'overlay' | 'inline';

interface LoadingStateProps {
  size?: LoadingStateSize;
  variant?: LoadingStateVariant;
  message?: string;
  color?: string;
}

const LoadingContainer = styled(Stack, {
  name: 'LoadingContainer',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    variant: {
      default: {
        flex: 1,
        paddingVertical: '$12',
      },
      overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '$backgroundOverlay',
        zIndex: 50,
      },
      inline: {
        flexDirection: 'row',
        paddingVertical: '$4',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

const LoadingMessage = styled(Text, {
  name: 'LoadingMessage',
  color: '$textSecondary',

  variants: {
    variant: {
      default: {
        marginTop: '$3',
      },
      overlay: {
        marginTop: '$3',
      },
      inline: {
        marginLeft: '$3',
      },
    },
    size: {
      sm: {
        fontSize: '$1',
      },
      md: {
        fontSize: '$2',
      },
      lg: {
        fontSize: '$3',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const SIZE_CONFIG: Record<LoadingStateSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
};

export function LoadingState({
  size = 'md',
  variant = 'default',
  message,
  color = colors.accent.primary,
}: LoadingStateProps): React.ReactElement {
  const indicatorSize = SIZE_CONFIG[size];
  const isInline = variant === 'inline';

  if (isInline) {
    return (
      <XStack alignItems="center" justifyContent="center" paddingVertical="$4">
        <ActivityIndicator testID="activity-indicator" size={indicatorSize} color={color} />
        {message && (
          <LoadingMessage variant="inline" size={size}>
            {message}
          </LoadingMessage>
        )}
      </XStack>
    );
  }

  return (
    <LoadingContainer variant={variant}>
      <ActivityIndicator testID="activity-indicator" size={indicatorSize} color={color} />
      {message && (
        <LoadingMessage variant={variant} size={size}>
          {message}
        </LoadingMessage>
      )}
    </LoadingContainer>
  );
}
