import { useCallback } from 'react';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styled, Stack, Text, YStack } from 'tamagui';

import { smsPermissions } from '@/infrastructure/sms';
import { Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

interface SmsPermissionDeniedProps {
  variant?: 'full' | 'compact';
  onRetry?: () => void;
  onSkip?: () => void;
}

const FullContainer = styled(YStack, {
  name: 'FullContainer',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$8',
  paddingVertical: 48,
});

const CompactContainer = styled(YStack, {
  name: 'CompactContainer',
  alignItems: 'center',
  paddingHorizontal: '$6',
  paddingVertical: '$8',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  marginHorizontal: '$4',
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 80,
  height: 80,
  borderRadius: '$full',
  backgroundColor: '$warningMuted',
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
  width: '100%',
  gap: '$3',
});

const Hint = styled(Text, {
  name: 'Hint',
  fontSize: '$1',
  color: '$textMuted',
  textAlign: 'center',
  marginTop: '$4',
});

const TITLE_TEXT = 'SMS Permission Required';
const MESSAGE_TEXT =
  'Monea needs access to your SMS messages to automatically detect bank transactions. Please enable SMS permissions in your device settings.';
const HINT_TEXT = 'You can also add transactions manually';
const OPEN_SETTINGS_LABEL = 'Open Settings';
const TRY_AGAIN_LABEL = 'Try Again';
const MAYBE_LATER_LABEL = 'Maybe Later';

export function SmsPermissionDenied({
  variant = 'full',
  onRetry,
  onSkip,
}: SmsPermissionDeniedProps): React.ReactElement {
  const Container = variant === 'full' ? FullContainer : CompactContainer;

  const handleOpenSettings = useCallback(async () => {
    await smsPermissions.openAppSettings();
  }, []);

  const handleRetry = useCallback(async () => {
    const result = await smsPermissions.checkPermissionState();
    if (result.state === 'granted' && onRetry) {
      onRetry();
    }
  }, [onRetry]);

  return (
    <Container>
      <IconContainer>
        <MaterialCommunityIcons
          name="message-lock-outline"
          size={40}
          color={colors.accent.warning}
        />
      </IconContainer>
      <Title>{TITLE_TEXT}</Title>
      <Message>{MESSAGE_TEXT}</Message>
      <ActionsContainer>
        <Button variant="primary" size="md" fullWidth onPress={handleOpenSettings}>
          {OPEN_SETTINGS_LABEL}
        </Button>
        {onRetry && (
          <Button variant="outline" size="md" fullWidth onPress={handleRetry}>
            {TRY_AGAIN_LABEL}
          </Button>
        )}
        {onSkip && (
          <Button variant="secondary" size="sm" fullWidth onPress={onSkip}>
            {MAYBE_LATER_LABEL}
          </Button>
        )}
      </ActionsContainer>
      <Hint>{HINT_TEXT}</Hint>
    </Container>
  );
}
