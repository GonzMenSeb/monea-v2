import { useCallback, useState } from 'react';

import { Modal, Pressable, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';

import { styled, Stack, Text, YStack, XStack } from 'tamagui';

import { Body, Caption, Button, Input } from '@/shared/components/ui';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface PasswordPromptProps {
  visible: boolean;
  fileName?: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  loading?: boolean;
  errorMessage?: string;
}

const ModalContainer = styled(Stack, {
  name: 'PasswordPromptContainer',
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.8)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '$4',
});

const ModalContent = styled(YStack, {
  name: 'PasswordPromptContent',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$5',
  width: '100%',
  maxWidth: 400,
  gap: '$4',
});

const HeaderSection = styled(YStack, {
  name: 'PasswordPromptHeader',
  alignItems: 'center',
  gap: '$3',
});

const IconContainer = styled(Stack, {
  name: 'PasswordIconContainer',
  width: 64,
  height: 64,
  borderRadius: '$full',
  backgroundColor: '$backgroundElevated',
  alignItems: 'center',
  justifyContent: 'center',
});

const FileNameBadge = styled(XStack, {
  name: 'FileNameBadge',
  backgroundColor: '$backgroundElevated',
  borderRadius: '$2',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  alignSelf: 'center',
  maxWidth: '100%',
});

const ActionButtons = styled(XStack, {
  name: 'PasswordPromptActions',
  gap: '$3',
  marginTop: '$2',
});

function PasswordPromptContent({
  fileName,
  onSubmit,
  onCancel,
  loading,
  errorMessage,
}: Omit<PasswordPromptProps, 'visible'>): React.ReactElement {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { light, success } = useHaptics();

  const handleSubmit = useCallback((): void => {
    if (password.trim() && !loading) {
      Keyboard.dismiss();
      success();
      onSubmit(password);
    }
  }, [password, loading, success, onSubmit]);

  const handleCancel = useCallback((): void => {
    Keyboard.dismiss();
    light();
    onCancel();
  }, [light, onCancel]);

  const handleToggleVisibility = useCallback((): void => {
    light();
    setShowPassword((prev) => !prev);
  }, [light]);

  const isSubmitDisabled = !password.trim() || loading;

  return (
    <ModalContent accessibilityRole="alert" accessibilityLabel="Password required for PDF">
      <HeaderSection>
        <IconContainer>
          <Text fontSize="$6">🔒</Text>
        </IconContainer>
        <YStack alignItems="center" gap="$1">
          <Body fontWeight="600" fontSize="$4">
            Password Required
          </Body>
          <Caption color="$textSecondary" textAlign="center">
            This PDF is password-protected. Enter the password to continue.
          </Caption>
        </YStack>
        {fileName && (
          <FileNameBadge>
            <Caption color="$textMuted" numberOfLines={1}>
              📄 {fileName}
            </Caption>
          </FileNameBadge>
        )}
      </HeaderSection>

      <YStack gap="$2">
        <Input
          label="PDF Password"
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          errorMessage={errorMessage}
          disabled={loading}
          rightIcon={
            <Pressable
              onPress={handleToggleVisibility}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text color="$textMuted">{showPassword ? '🙈' : '👁️'}</Text>
            </Pressable>
          }
          onRightIconPress={handleToggleVisibility}
        />
      </YStack>

      <ActionButtons>
        <Button
          variant="outline"
          onPress={handleCancel}
          disabled={loading}
          fullWidth
          testID="password-cancel-button"
        >
          Cancel
        </Button>
        <Button
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          loading={loading}
          fullWidth
          testID="password-submit-button"
        >
          Unlock
        </Button>
      </ActionButtons>
    </ModalContent>
  );
}

export function PasswordPrompt({
  visible,
  fileName,
  onSubmit,
  onCancel,
  loading = false,
  errorMessage,
}: PasswordPromptProps): React.ReactElement {
  const { light } = useHaptics();

  const handleCancel = useCallback((): void => {
    Keyboard.dismiss();
    light();
    onCancel();
  }, [light, onCancel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={{ flex: 1 }} onPress={handleCancel}>
          <ModalContainer>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {visible && (
                <PasswordPromptContent
                  fileName={fileName}
                  onSubmit={onSubmit}
                  onCancel={onCancel}
                  loading={loading}
                  errorMessage={errorMessage}
                />
              )}
            </Pressable>
          </ModalContainer>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export type { PasswordPromptProps };
