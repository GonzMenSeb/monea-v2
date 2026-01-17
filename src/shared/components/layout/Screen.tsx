import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import type { PropsWithChildren } from 'react';

type ScreenVariant = 'fixed' | 'scroll';

interface ScreenProps extends Omit<ViewProps, 'children'> {
  variant?: ScreenVariant;
  edges?: Edge[];
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  keyboardAvoiding?: boolean;
  scrollEnabled?: boolean;
  contentContainerClassName?: string;
}

const DEFAULT_EDGES: Edge[] = ['top', 'bottom', 'left', 'right'];

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
  },
});

export function Screen({
  children,
  variant = 'fixed',
  edges = DEFAULT_EDGES,
  backgroundColor = '#FFFFFF',
  statusBarStyle = 'dark-content',
  keyboardAvoiding = true,
  scrollEnabled = true,
  contentContainerClassName,
  className,
  ...viewProps
}: PropsWithChildren<ScreenProps>): React.ReactElement {
  const content =
    variant === 'scroll' ? (
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        contentContainerClassName={contentContainerClassName}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {children}
      </ScrollView>
    ) : (
      <View className={`flex-1 ${contentContainerClassName ?? ''}`} {...viewProps}>
        {children}
      </View>
    );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView
      className={`flex-1 ${className ?? ''}`}
      edges={edges}
      style={[styles.safeArea, { backgroundColor }]}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} translucent={false} />
      {wrappedContent}
    </SafeAreaView>
  );
}
