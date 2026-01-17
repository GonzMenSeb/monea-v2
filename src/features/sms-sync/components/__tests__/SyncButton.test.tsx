import { fireEvent, render, screen } from '@testing-library/react-native';

import { SyncButton } from '../SyncButton';

import type { SyncButtonProps } from '../SyncButton';

const createDefaultProps = (overrides: Partial<SyncButtonProps> = {}): SyncButtonProps => ({
  isSyncing: false,
  isListening: false,
  permissionState: 'granted',
  onSyncPress: jest.fn(),
  ...overrides,
});

interface AccessibilityState {
  disabled?: boolean;
}

interface ButtonProps {
  accessibilityState?: AccessibilityState;
}

function getButtonAccessibilityState(button: ReturnType<typeof screen.getByRole>): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const props = button.props as ButtonProps;
  return props.accessibilityState?.disabled ?? false;
}

describe('SyncButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SyncButton {...createDefaultProps()} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('renders with primary variant by default', () => {
      render(<SyncButton {...createDefaultProps({ isListening: true })} />);
      expect(screen.getByText('Sync Now')).toBeTruthy();
    });

    it('renders with secondary variant', () => {
      render(<SyncButton {...createDefaultProps({ variant: 'secondary', isListening: true })} />);
      expect(screen.getByText('Sync Now')).toBeTruthy();
    });

    it('renders icon-only variant without label', () => {
      render(<SyncButton {...createDefaultProps({ variant: 'icon' })} />);
      expect(screen.queryByText('Start Sync')).toBeNull();
    });
  });

  describe('Button States', () => {
    it('shows "Start Sync" when not listening', () => {
      render(<SyncButton {...createDefaultProps({ isListening: false })} />);
      expect(screen.getByText('Start Sync')).toBeTruthy();
    });

    it('shows "Sync Now" when listening', () => {
      render(<SyncButton {...createDefaultProps({ isListening: true })} />);
      expect(screen.getByText('Sync Now')).toBeTruthy();
    });

    it('shows "Syncing..." when syncing', () => {
      render(<SyncButton {...createDefaultProps({ isSyncing: true })} />);
      expect(screen.getByText('Syncing...')).toBeTruthy();
    });

    it('shows "Grant Permission" when permission denied', () => {
      render(<SyncButton {...createDefaultProps({ permissionState: 'denied' })} />);
      expect(screen.getByText('Grant Permission')).toBeTruthy();
    });
  });

  describe('Custom Labels', () => {
    it('uses custom label when provided', () => {
      render(<SyncButton {...createDefaultProps({ label: 'Custom Label' })} />);
      expect(screen.getByText('Custom Label')).toBeTruthy();
    });

    it('overrides default state label with custom label', () => {
      render(<SyncButton {...createDefaultProps({ isSyncing: true, label: 'Processing...' })} />);
      expect(screen.getByText('Processing...')).toBeTruthy();
      expect(screen.queryByText('Syncing...')).toBeNull();
    });
  });

  describe('Disabled States', () => {
    it('is disabled when syncing', () => {
      render(<SyncButton {...createDefaultProps({ isSyncing: true })} />);
      expect(getButtonAccessibilityState(screen.getByRole('button'))).toBe(true);
    });

    it('is disabled when disabled prop is true', () => {
      render(<SyncButton {...createDefaultProps({ disabled: true })} />);
      expect(getButtonAccessibilityState(screen.getByRole('button'))).toBe(true);
    });

    it('is not disabled when permission is denied', () => {
      render(<SyncButton {...createDefaultProps({ permissionState: 'denied' })} />);
      expect(getButtonAccessibilityState(screen.getByRole('button'))).toBe(false);
    });

    it('is not disabled when idle', () => {
      render(<SyncButton {...createDefaultProps()} />);
      expect(getButtonAccessibilityState(screen.getByRole('button'))).toBe(false);
    });
  });

  describe('Press Handlers', () => {
    it('calls onSyncPress when pressed and permission granted', () => {
      const onSyncPress = jest.fn();
      render(<SyncButton {...createDefaultProps({ onSyncPress, isListening: true })} />);

      fireEvent.press(screen.getByRole('button'));
      expect(onSyncPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPermissionPress when pressed and permission denied', () => {
      const onSyncPress = jest.fn();
      const onPermissionPress = jest.fn();
      render(
        <SyncButton
          {...createDefaultProps({
            onSyncPress,
            onPermissionPress,
            permissionState: 'denied',
          })}
        />
      );

      fireEvent.press(screen.getByRole('button'));
      expect(onPermissionPress).toHaveBeenCalledTimes(1);
      expect(onSyncPress).not.toHaveBeenCalled();
    });

    it('calls onSyncPress when permission denied but no onPermissionPress provided', () => {
      const onSyncPress = jest.fn();
      render(
        <SyncButton
          {...createDefaultProps({
            onSyncPress,
            permissionState: 'denied',
          })}
        />
      );

      fireEvent.press(screen.getByRole('button'));
      expect(onSyncPress).toHaveBeenCalledTimes(1);
    });

    it('does not call handlers when disabled', () => {
      const onSyncPress = jest.fn();
      render(<SyncButton {...createDefaultProps({ onSyncPress, disabled: true })} />);

      fireEvent.press(screen.getByRole('button'));
      expect(onSyncPress).not.toHaveBeenCalled();
    });

    it('does not call handlers when syncing', () => {
      const onSyncPress = jest.fn();
      render(<SyncButton {...createDefaultProps({ onSyncPress, isSyncing: true })} />);

      fireEvent.press(screen.getByRole('button'));
      expect(onSyncPress).not.toHaveBeenCalled();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<SyncButton {...createDefaultProps({ size: 'sm' })} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('renders medium size by default', () => {
      render(<SyncButton {...createDefaultProps()} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('renders large size', () => {
      render(<SyncButton {...createDefaultProps({ size: 'lg' })} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<SyncButton {...createDefaultProps()} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('has correct accessibility label based on state', () => {
      render(<SyncButton {...createDefaultProps({ isListening: true })} />);
      expect(screen.getByLabelText('Sync Now')).toBeTruthy();
    });

    it('uses custom label for accessibility when provided', () => {
      render(<SyncButton {...createDefaultProps({ label: 'Manual Sync' })} />);
      expect(screen.getByLabelText('Manual Sync')).toBeTruthy();
    });

    it('indicates disabled state for accessibility', () => {
      render(<SyncButton {...createDefaultProps({ isSyncing: true })} />);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const button = screen.getByRole('button');
      expect(getButtonAccessibilityState(button)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown permission state', () => {
      render(<SyncButton {...createDefaultProps({ permissionState: 'unknown' })} />);
      expect(screen.getByText('Start Sync')).toBeTruthy();
    });

    it('handles checking permission state', () => {
      render(<SyncButton {...createDefaultProps({ permissionState: 'checking' })} />);
      expect(screen.getByText('Start Sync')).toBeTruthy();
    });

    it('syncing state takes priority over listening', () => {
      render(<SyncButton {...createDefaultProps({ isSyncing: true, isListening: true })} />);
      expect(screen.getByText('Syncing...')).toBeTruthy();
    });

    it('permission denied takes priority over other states', () => {
      render(
        <SyncButton
          {...createDefaultProps({
            permissionState: 'denied',
            isListening: true,
            isSyncing: true,
          })}
        />
      );
      expect(screen.getByText('Grant Permission')).toBeTruthy();
    });
  });
});
