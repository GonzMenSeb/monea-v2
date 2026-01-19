import { Component, type ErrorInfo, type ReactNode } from 'react';

import { styled, Stack, Text, YStack } from 'tamagui';

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

const Container = styled(YStack, {
  name: 'Container',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$8',
  paddingVertical: 48,
  backgroundColor: '$backgroundBase',
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

const ErrorDetails = styled(Text, {
  name: 'ErrorDetails',
  fontSize: '$1',
  color: '$textMuted',
  textAlign: 'center',
  marginTop: '$4',
  maxWidth: 280,
  fontFamily: '$mono',
  backgroundColor: '$backgroundSurface',
  padding: '$3',
  borderRadius: '$3',
});

const ActionContainer = styled(Stack, {
  name: 'ActionContainer',
  marginTop: '$8',
});

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
        <Container>
          <IconContainer>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={40}
              color={colors.accent.danger}
            />
          </IconContainer>
          <Title>Something went wrong</Title>
          <Message>
            An unexpected error occurred. Please try again or restart the app if the problem
            persists.
          </Message>
          {__DEV__ && this.state.error && (
            <ErrorDetails numberOfLines={3}>
              {this.state.error.message}
            </ErrorDetails>
          )}
          <ActionContainer>
            <Button variant="primary" size="md" onPress={this.handleReset}>
              {DEFAULT_RETRY_LABEL}
            </Button>
          </ActionContainer>
        </Container>
      );
    }

    return this.props.children;
  }
}
