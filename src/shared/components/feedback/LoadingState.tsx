import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '@/shared/theme';

type LoadingStateSize = 'sm' | 'md' | 'lg';
type LoadingStateVariant = 'default' | 'overlay' | 'inline';

interface LoadingStateProps {
  size?: LoadingStateSize;
  variant?: LoadingStateVariant;
  message?: string;
  color?: string;
}

const SIZE_CONFIG: Record<LoadingStateSize, { indicator: 'small' | 'large'; text: string }> = {
  sm: { indicator: 'small', text: 'text-xs' },
  md: { indicator: 'small', text: 'text-sm' },
  lg: { indicator: 'large', text: 'text-base' },
};

const VARIANT_STYLES: Record<LoadingStateVariant, string> = {
  default: 'flex-1 items-center justify-center py-12',
  overlay: 'absolute inset-0 items-center justify-center bg-surface-overlay z-50',
  inline: 'flex-row items-center justify-center py-4',
};

const MESSAGE_STYLES = 'text-text-secondary mt-3';
const INLINE_MESSAGE_STYLES = 'text-text-secondary ml-3';

export function LoadingState({
  size = 'md',
  variant = 'default',
  message,
  color = colors.primary.DEFAULT,
}: LoadingStateProps): React.ReactElement {
  const sizeConfig = SIZE_CONFIG[size];
  const containerStyle = VARIANT_STYLES[variant];
  const isInline = variant === 'inline';

  return (
    <View className={containerStyle}>
      <ActivityIndicator size={sizeConfig.indicator} color={color} />
      {message && (
        <Text className={`${sizeConfig.text} ${isInline ? INLINE_MESSAGE_STYLES : MESSAGE_STYLES}`}>
          {message}
        </Text>
      )}
    </View>
  );
}
