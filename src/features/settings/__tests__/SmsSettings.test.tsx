import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useSmsSync } from '@/features/sms-sync/hooks';

import { SmsSettings } from '../screens/SmsSettings';

jest.mock('expo-router');
jest.mock('@/features/sms-sync/hooks');

const mockRouter = {
  back: jest.fn(),
};

const mockSmsSyncDefault = {
  permissionState: 'granted' as const,
  permissionStatus: {
    hasReadSmsPermission: true,
    hasReceiveSmsPermission: true,
  },
  isListening: false,
  unprocessedCount: 0,
  isSyncing: false,
  requestPermissions: jest.fn(),
  openSettings: jest.fn(),
  startListening: jest.fn(),
  stopListening: jest.fn(),
  reprocessFailed: jest.fn(),
  refreshUnprocessedCount: jest.fn(),
};

describe('SmsSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSmsSync as jest.Mock).mockReturnValue(mockSmsSyncDefault);
  });

  describe('navigation', () => {
    it('navigates back when back button is pressed', () => {
      render(<SmsSettings />);

      fireEvent.press(screen.getByLabelText('Go back'));

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('permission status display', () => {
    it('shows granted status when all permissions are granted', () => {
      render(<SmsSettings />);

      expect(screen.getByText('All permissions granted')).toBeTruthy();
      expect(screen.getAllByText('Granted')).toHaveLength(2);
    });

    it('shows denied status when permissions are denied', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'denied',
        permissionStatus: {
          hasReadSmsPermission: false,
          hasReceiveSmsPermission: false,
        },
      });

      render(<SmsSettings />);

      expect(screen.getByText('Permissions required')).toBeTruthy();
      expect(screen.getAllByText('Not granted')).toHaveLength(2);
    });

    it('shows blocked status when permissions are blocked', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'blocked',
        permissionStatus: {
          hasReadSmsPermission: false,
          hasReceiveSmsPermission: false,
        },
      });

      render(<SmsSettings />);

      expect(screen.getByText('Permissions blocked')).toBeTruthy();
    });

    it('shows checking status while checking permissions', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'checking',
      });

      render(<SmsSettings />);

      expect(screen.getByText('Checking permissions...')).toBeTruthy();
    });

    it('shows partial permission status correctly', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'denied',
        permissionStatus: {
          hasReadSmsPermission: true,
          hasReceiveSmsPermission: false,
        },
      });

      render(<SmsSettings />);

      expect(screen.getByText('Granted')).toBeTruthy();
      expect(screen.getByText('Not granted')).toBeTruthy();
    });
  });

  describe('permission actions', () => {
    it('shows grant permissions button when permissions are denied', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'denied',
        permissionStatus: {
          hasReadSmsPermission: false,
          hasReceiveSmsPermission: false,
        },
      });

      render(<SmsSettings />);

      expect(screen.getByText('Grant Permissions')).toBeTruthy();
    });

    it('calls requestPermissions when grant button is pressed', async () => {
      const requestPermissions = jest.fn().mockResolvedValue(undefined);
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'denied',
        permissionStatus: {
          hasReadSmsPermission: false,
          hasReceiveSmsPermission: false,
        },
        requestPermissions,
      });

      render(<SmsSettings />);

      fireEvent.press(screen.getByText('Grant Permissions'));

      await waitFor(() => {
        expect(requestPermissions).toHaveBeenCalled();
      });
    });

    it('shows open settings button when permissions are blocked', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'blocked',
        permissionStatus: {
          hasReadSmsPermission: false,
          hasReceiveSmsPermission: false,
        },
      });

      render(<SmsSettings />);

      expect(screen.getByText('Open App Settings')).toBeTruthy();
    });

    it('calls openSettings when open settings button is pressed', async () => {
      const openSettings = jest.fn().mockResolvedValue(undefined);
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'blocked',
        permissionStatus: {
          hasReadSmsPermission: false,
          hasReceiveSmsPermission: false,
        },
        openSettings,
      });

      render(<SmsSettings />);

      fireEvent.press(screen.getByText('Open App Settings'));

      await waitFor(() => {
        expect(openSettings).toHaveBeenCalled();
      });
    });

    it('does not show permission actions when granted', () => {
      render(<SmsSettings />);

      expect(screen.queryByText('Grant Permissions')).toBeNull();
      expect(screen.queryByText('Open App Settings')).toBeNull();
    });
  });

  describe('sync stats', () => {
    it('shows sync stats when permissions are granted', () => {
      render(<SmsSettings />);

      expect(screen.getByText('Sync Status')).toBeTruthy();
      expect(screen.getByText('Unprocessed')).toBeTruthy();
    });

    it('shows inactive status when not listening', () => {
      render(<SmsSettings />);

      expect(screen.getByText('Inactive')).toBeTruthy();
    });

    it('shows active status when listening', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        isListening: true,
      });

      render(<SmsSettings />);

      expect(screen.getByText('Active')).toBeTruthy();
    });

    it('displays unprocessed count', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        unprocessedCount: 5,
      });

      render(<SmsSettings />);

      expect(screen.getByText('5')).toBeTruthy();
    });

    it('does not show sync stats when permissions are not granted', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'denied',
      });

      render(<SmsSettings />);

      expect(screen.queryByText('Sync Status')).toBeNull();
    });
  });

  describe('real-time sync toggle', () => {
    it('renders sync toggle switch', () => {
      render(<SmsSettings />);

      expect(screen.getByText('Auto-sync incoming SMS')).toBeTruthy();
    });

    it('calls startListening when toggle is enabled', () => {
      const startListening = jest.fn();
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        startListening,
      });

      render(<SmsSettings />);

      const toggle = screen.getByRole('switch');
      fireEvent(toggle, 'valueChange', true);

      expect(startListening).toHaveBeenCalled();
    });

    it('calls stopListening when toggle is disabled', () => {
      const stopListening = jest.fn();
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        isListening: true,
        stopListening,
      });

      render(<SmsSettings />);

      const toggle = screen.getByRole('switch');
      fireEvent(toggle, 'valueChange', false);

      expect(stopListening).toHaveBeenCalled();
    });

    it('disables toggle when permissions are not granted', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'denied',
      });

      render(<SmsSettings />);

      const toggle = screen.getByRole('switch');
      expect(toggle.props.disabled).toBe(true);
    });

    it('shows warning message when permissions are not granted', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        permissionState: 'denied',
      });

      render(<SmsSettings />);

      expect(screen.getByText('Grant SMS permissions to enable real-time sync')).toBeTruthy();
    });
  });

  describe('reprocess failed messages', () => {
    it('shows reprocess button when there are unprocessed messages', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        unprocessedCount: 3,
      });

      render(<SmsSettings />);

      expect(screen.getByText('Reprocess 3 Failed Messages')).toBeTruthy();
    });

    it('does not show reprocess button when no unprocessed messages', () => {
      render(<SmsSettings />);

      expect(screen.queryByText(/Reprocess/)).toBeNull();
    });

    it('calls reprocessFailed when button is pressed', async () => {
      const reprocessFailed = jest.fn().mockResolvedValue(undefined);
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        unprocessedCount: 3,
        reprocessFailed,
      });

      render(<SmsSettings />);

      fireEvent.press(screen.getByText('Reprocess 3 Failed Messages'));

      await waitFor(() => {
        expect(reprocessFailed).toHaveBeenCalled();
      });
    });

    it('shows reprocessing state when processing', async () => {
      const reprocessFailed = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        unprocessedCount: 3,
        reprocessFailed,
      });

      render(<SmsSettings />);

      fireEvent.press(screen.getByText('Reprocess 3 Failed Messages'));

      expect(screen.getByText('Reprocessing...')).toBeTruthy();
    });

    it('disables button while reprocessing', async () => {
      const reprocessFailed = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        unprocessedCount: 3,
        reprocessFailed,
      });

      render(<SmsSettings />);

      const button = screen.getByText('Reprocess 3 Failed Messages');
      fireEvent.press(button);

      expect(screen.getByText('Reprocessing...')).toBeTruthy();
    });

    it('disables button while syncing', () => {
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        unprocessedCount: 3,
        isSyncing: true,
      });

      render(<SmsSettings />);

      expect(screen.getByText('Reprocess 3 Failed Messages')).toBeTruthy();
    });
  });

  describe('supported banks', () => {
    it('displays all supported banks', () => {
      render(<SmsSettings />);

      expect(screen.getByText('Bancolombia')).toBeTruthy();
      expect(screen.getByText('Davivienda')).toBeTruthy();
      expect(screen.getByText('BBVA')).toBeTruthy();
      expect(screen.getByText('Nequi')).toBeTruthy();
      expect(screen.getByText('Daviplata')).toBeTruthy();
    });
  });

  describe('information sections', () => {
    it('displays how it works section', () => {
      render(<SmsSettings />);

      expect(screen.getByText(/How it works/i)).toBeTruthy();
      expect(
        screen.getByText('Monea reads incoming SMS messages from supported Colombian banks')
      ).toBeTruthy();
      expect(
        screen.getByText('Transaction data is extracted and stored locally on your device')
      ).toBeTruthy();
      expect(
        screen.getByText('Your data never leaves your phone - complete privacy guaranteed')
      ).toBeTruthy();
    });

    it('displays privacy notice', () => {
      render(<SmsSettings />);

      expect(
        screen.getByText(
          'SMS data is processed locally and never uploaded to any server. Your financial information remains private and secure on your device.'
        )
      ).toBeTruthy();
    });
  });

  describe('initialization', () => {
    it('calls refreshUnprocessedCount on mount', () => {
      const refreshUnprocessedCount = jest.fn();
      (useSmsSync as jest.Mock).mockReturnValue({
        ...mockSmsSyncDefault,
        refreshUnprocessedCount,
      });

      render(<SmsSettings />);

      expect(refreshUnprocessedCount).toHaveBeenCalled();
    });
  });
});
