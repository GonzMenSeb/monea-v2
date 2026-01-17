import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Text, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';

import { Button } from '../ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const CONTAINER_STYLES = 'flex-1 items-center justify-center px-8 py-12 bg-background-primary';
const ICON_CONTAINER_STYLES =
  'w-20 h-20 rounded-full bg-semantic-error/10 items-center justify-center mb-6';
const TITLE_STYLES = 'text-xl font-bold text-text-primary text-center';
const MESSAGE_STYLES = 'text-sm text-text-secondary text-center mt-3 max-w-xs';
const ERROR_DETAILS_STYLES =
  'text-xs text-text-tertiary text-center mt-4 max-w-xs font-mono bg-background-secondary p-3 rounded-lg';
const ACTION_CONTAINER_STYLES = 'mt-8';
const DEFAULT_RETRY_LABEL = 'Try Again';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);

    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className={CONTAINER_STYLES}>
          <View className={ICON_CONTAINER_STYLES}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={40}
              color={colors.semantic.error}
            />
          </View>
          <Text className={TITLE_STYLES}>Something went wrong</Text>
          <Text className={MESSAGE_STYLES}>
            An unexpected error occurred. Please try again or restart the app if the problem
            persists.
          </Text>
          {__DEV__ && this.state.error && (
            <Text className={ERROR_DETAILS_STYLES} numberOfLines={3}>
              {this.state.error.message}
            </Text>
          )}
          <View className={ACTION_CONTAINER_STYLES}>
            <Button variant="primary" size="md" onPress={this.handleReset}>
              {DEFAULT_RETRY_LABEL}
            </Button>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
