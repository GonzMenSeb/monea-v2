import { KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';

import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { styled, Stack, type GetProps } from 'tamagui';

import { colors } from '@/shared/theme';

import type { PropsWithChildren } from 'react';

type ScreenVariant = 'fixed' | 'scroll';

const ScreenContainer = styled(Stack, {
  name: 'ScreenContainer',
  flex: 1,
  backgroundColor: '$backgroundBase',
});

interface ScreenProps extends GetProps<typeof ScreenContainer> {
  variant?: ScreenVariant;
  edges?: Edge[];
  statusBarStyle?: 'light-content' | 'dark-content';
  keyboardAvoiding?: boolean;
  scrollEnabled?: boolean;
}

const DEFAULT_EDGES: Edge[] = ['top', 'bottom', 'left', 'right'];

export function Screen({
  children,
  variant = 'fixed',
  edges = DEFAULT_EDGES,
  statusBarStyle = 'light-content',
  keyboardAvoiding = true,
  scrollEnabled = true,
  ...props
}: PropsWithChildren<ScreenProps>): React.ReactElement {
  const content =
    variant === 'scroll' ? (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {children}
      </ScrollView>
    ) : (
      <ScreenContainer {...props}>{children}</ScreenContainer>
    );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.base }} edges={edges}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={colors.background.base}
        translucent={false}
      />
      {wrappedContent}
    </SafeAreaView>
  );
}
