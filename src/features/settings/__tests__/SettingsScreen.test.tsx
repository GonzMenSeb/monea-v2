import { Linking } from 'react-native';

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { smsPermissions } from '@/infrastructure/sms';

import { SettingsScreen } from '../screens/SettingsScreen';

jest.mock('expo-router');
jest.mock('@/infrastructure/sms');

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  describe('permission state display', () => {
    it('shows checking state initially', async () => {
      (smsPermissions.checkPermissionState as jest.Mock).mockResolvedValue({
        state: 'checking',
      });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Checking...')).toBeTruthy();
      });
    });

    it('shows granted state when permissions are granted', async () => {
      (smsPermissions.checkPermissionState as jest.Mock).mockResolvedValue({
        state: 'granted',
      });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Enabled')).toBeTruthy();
      });
    });

    it('shows denied state when permissions are denied', async () => {
      (smsPermissions.checkPermissionState as jest.Mock).mockResolvedValue({
        state: 'denied',
      });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Denied')).toBeTruthy();
      });
    });

    it('shows blocked state when permissions are blocked', async () => {
      (smsPermissions.checkPermissionState as jest.Mock).mockResolvedValue({
        state: 'blocked',
      });

      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Blocked')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      (smsPermissions.checkPermissionState as jest.Mock).mockResolvedValue({
        state: 'granted',
      });
    });

    it('navigates to SMS settings when pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('SMS Settings')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('SMS Settings'));

      expect(mockRouter.push).toHaveBeenCalledWith('/settings/sms');
    });

    it('navigates to bank accounts when pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Bank Accounts')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bank Accounts'));

      expect(mockRouter.push).toHaveBeenCalledWith('/settings/accounts');
    });

    it('navigates to about screen when pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('About')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('About'));

      expect(mockRouter.push).toHaveBeenCalledWith('/settings/about');
    });

    it('navigates to clear data screen when pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Clear All Data')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Clear All Data'));

      expect(mockRouter.push).toHaveBeenCalledWith('/settings/clear-data');
    });
  });

  describe('external links', () => {
    beforeEach(() => {
      (smsPermissions.checkPermissionState as jest.Mock).mockResolvedValue({
        state: 'granted',
      });
    });

    it('opens system settings when notifications is pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Notifications'));

      expect(Linking.openSettings).toHaveBeenCalled();
    });

    it('opens email client when help is pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Help & Support')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Help & Support'));

      expect(Linking.openURL).toHaveBeenCalledWith('mailto:support@monea.app');
    });

    it('opens privacy policy URL when pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Privacy Policy')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Privacy Policy'));

      expect(Linking.openURL).toHaveBeenCalledWith('https://monea.app/privacy');
    });

    it('opens terms of service URL when pressed', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Terms of Service')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Terms of Service'));

      expect(Linking.openURL).toHaveBeenCalledWith('https://monea.app/terms');
    });
  });

  describe('sections', () => {
    beforeEach(() => {
      (smsPermissions.checkPermissionState as jest.Mock).mockResolvedValue({
        state: 'granted',
      });
    });

    it('renders all section titles', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Bank & SMS/i)).toBeTruthy();
        expect(screen.getByText(/App Settings/i)).toBeTruthy();
        expect(screen.getAllByText(/Support/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Legal/i)).toBeTruthy();
        expect(screen.getAllByText(/Data/i).length).toBeGreaterThan(0);
      });
    });

    it('renders app version information', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Monea v1.0.0')).toBeTruthy();
        expect(screen.getByText('Made with ❤️ in Colombia')).toBeTruthy();
      });
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      (smsPermissions.checkPermissionState as jest.Mock).mockResolvedValue({
        state: 'granted',
      });
    });

    it('has proper accessibility roles for buttons', async () => {
      render(<SettingsScreen />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });
});
