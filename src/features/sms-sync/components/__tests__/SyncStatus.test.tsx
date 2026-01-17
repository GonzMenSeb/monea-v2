import { fireEvent, render, screen } from '@testing-library/react-native';

import { SyncStatus } from '../SyncStatus';

import type { SyncStatusProps } from '../SyncStatus';

const createDefaultProps = (overrides: Partial<SyncStatusProps> = {}): SyncStatusProps => ({
  isSyncing: false,
  isListening: false,
  permissionState: 'granted',
  lastSyncResult: null,
  lastProcessResult: null,
  error: null,
  unprocessedCount: 0,
  ...overrides,
});

describe('SyncStatus', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SyncStatus {...createDefaultProps()} />);
      expect(screen.getByText('Not monitoring')).toBeTruthy();
    });

    it('renders compact variant by default', () => {
      render(<SyncStatus {...createDefaultProps({ isListening: true })} />);
      expect(screen.getByText('Monitoring SMS')).toBeTruthy();
    });
  });

  describe('Status States', () => {
    it('shows syncing state when isSyncing is true', () => {
      render(<SyncStatus {...createDefaultProps({ isSyncing: true })} />);
      expect(screen.getByText('Syncing...')).toBeTruthy();
    });

    it('shows listening state when isListening is true', () => {
      render(<SyncStatus {...createDefaultProps({ isListening: true })} />);
      expect(screen.getByText('Monitoring SMS')).toBeTruthy();
    });

    it('shows idle state when not syncing or listening', () => {
      render(<SyncStatus {...createDefaultProps()} />);
      expect(screen.getByText('Not monitoring')).toBeTruthy();
    });

    it('shows error state when error is present', () => {
      const error = new Error('Connection failed');
      render(<SyncStatus {...createDefaultProps({ error })} />);
      expect(screen.getByText('Error')).toBeTruthy();
    });

    it('shows permission denied state when permission is denied', () => {
      render(<SyncStatus {...createDefaultProps({ permissionState: 'denied' })} />);
      expect(screen.getByText('Permission Required')).toBeTruthy();
    });

    it('prioritizes error state over syncing state', () => {
      const error = new Error('Failed');
      render(<SyncStatus {...createDefaultProps({ isSyncing: true, error })} />);
      expect(screen.getByText('Error')).toBeTruthy();
    });

    it('prioritizes permission denied over listening state', () => {
      render(
        <SyncStatus {...createDefaultProps({ isListening: true, permissionState: 'denied' })} />
      );
      expect(screen.getByText('Permission Required')).toBeTruthy();
    });
  });

  describe('Compact Variant', () => {
    it('displays status label', () => {
      render(<SyncStatus {...createDefaultProps({ isListening: true, variant: 'compact' })} />);
      expect(screen.getByText('Monitoring SMS')).toBeTruthy();
    });

    it('displays syncing indicator when syncing', () => {
      render(<SyncStatus {...createDefaultProps({ isSyncing: true, variant: 'compact' })} />);
      expect(screen.getByText('Syncing...')).toBeTruthy();
    });
  });

  describe('Detailed Variant', () => {
    it('displays status label and description', () => {
      render(
        <SyncStatus
          {...createDefaultProps({
            isListening: true,
            variant: 'detailed',
            unprocessedCount: 0,
          })}
        />
      );
      expect(screen.getByText('Monitoring SMS')).toBeTruthy();
      expect(screen.getByText('Waiting for bank SMS')).toBeTruthy();
    });

    it('shows processing message when syncing', () => {
      render(<SyncStatus {...createDefaultProps({ isSyncing: true, variant: 'detailed' })} />);
      expect(screen.getByText('Processing messages...')).toBeTruthy();
    });

    it('shows unprocessed count when available', () => {
      render(
        <SyncStatus
          {...createDefaultProps({
            isListening: true,
            variant: 'detailed',
            unprocessedCount: 3,
          })}
        />
      );
      expect(screen.getByText('3 messages pending')).toBeTruthy();
    });

    it('shows singular message for single unprocessed', () => {
      render(
        <SyncStatus
          {...createDefaultProps({
            isListening: true,
            variant: 'detailed',
            unprocessedCount: 1,
          })}
        />
      );
      expect(screen.getByText('1 message pending')).toBeTruthy();
    });

    it('shows error message in detailed variant', () => {
      const error = new Error('Connection timeout');
      render(<SyncStatus {...createDefaultProps({ error, variant: 'detailed' })} />);
      expect(screen.getByText('Connection timeout')).toBeTruthy();
    });

    it('shows last sync result count', () => {
      const lastSyncResult = { processed: 5, created: 3, skipped: 2, errors: [] };
      render(
        <SyncStatus
          {...createDefaultProps({
            isListening: true,
            variant: 'detailed',
            lastSyncResult,
          })}
        />
      );
      expect(screen.getByText('3 new')).toBeTruthy();
    });

    it('shows last transaction recorded after successful process', () => {
      const lastProcessResult = { success: true as const, transactionId: '123', accountId: '456' };
      render(
        <SyncStatus
          {...createDefaultProps({
            isListening: true,
            variant: 'detailed',
            lastProcessResult,
          })}
        />
      );
      expect(screen.getByText('Last transaction recorded')).toBeTruthy();
    });

    it('shows permission required description', () => {
      render(
        <SyncStatus
          {...createDefaultProps({
            permissionState: 'denied',
            variant: 'detailed',
          })}
        />
      );
      expect(screen.getByText('SMS access needed')).toBeTruthy();
    });
  });

  describe('Badge Variant', () => {
    it('displays shortened status', () => {
      render(<SyncStatus {...createDefaultProps({ isListening: true, variant: 'badge' })} />);
      expect(screen.getByText('Monitoring SMS')).toBeTruthy();
    });

    it('shows count instead of status when unprocessed messages exist', () => {
      render(
        <SyncStatus
          {...createDefaultProps({
            isListening: true,
            variant: 'badge',
            unprocessedCount: 5,
          })}
        />
      );
      expect(screen.getByText('5')).toBeTruthy();
    });

    it('shows status when syncing even with unprocessed count', () => {
      render(
        <SyncStatus
          {...createDefaultProps({
            isSyncing: true,
            variant: 'badge',
            unprocessedCount: 5,
          })}
        />
      );
      expect(screen.getByText('Syncing...')).toBeTruthy();
    });
  });

  describe('Interactivity', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<SyncStatus {...createDefaultProps({ onPress })} />);

      fireEvent.press(screen.getByRole('button'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('renders as View when onPress is not provided', () => {
      render(<SyncStatus {...createDefaultProps()} />);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('has correct accessibility label when listening', () => {
      const onPress = jest.fn();
      render(<SyncStatus {...createDefaultProps({ isListening: true, onPress })} />);

      expect(screen.getByLabelText('Monitoring SMS')).toBeTruthy();
    });

    it('has correct accessibility label when error', () => {
      const onPress = jest.fn();
      const error = new Error('Test error');
      render(<SyncStatus {...createDefaultProps({ error, onPress })} />);

      expect(screen.getByLabelText('Error')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown permission state as idle', () => {
      render(<SyncStatus {...createDefaultProps({ permissionState: 'unknown' })} />);
      expect(screen.getByText('Not monitoring')).toBeTruthy();
    });

    it('handles checking permission state as idle', () => {
      render(<SyncStatus {...createDefaultProps({ permissionState: 'checking' })} />);
      expect(screen.getByText('Not monitoring')).toBeTruthy();
    });

    it('handles zero unprocessed count', () => {
      render(
        <SyncStatus
          {...createDefaultProps({
            variant: 'detailed',
            unprocessedCount: 0,
          })}
        />
      );
      expect(screen.queryByText(/pending/)).toBeNull();
    });

    it('handles null lastSyncResult', () => {
      render(
        <SyncStatus
          {...createDefaultProps({
            variant: 'detailed',
            lastSyncResult: null,
          })}
        />
      );
      expect(screen.queryByText(/new/)).toBeNull();
    });

    it('handles failed process result', () => {
      const lastProcessResult = { success: false as const, reason: 'parse_failed' as const };
      render(
        <SyncStatus
          {...createDefaultProps({
            isListening: true,
            variant: 'detailed',
            lastProcessResult,
          })}
        />
      );
      expect(screen.getByText('Waiting for bank SMS')).toBeTruthy();
    });
  });
});
