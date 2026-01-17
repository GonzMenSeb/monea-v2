import { openSettings } from 'expo-linking';

import { SmsPermissions } from '../SmsPermissions';

import type { SmsPermissionStatus } from '../types';

const mockCheckPermissions = jest.fn<Promise<SmsPermissionStatus>, []>();
const mockRequestPermissions = jest.fn<Promise<boolean>, []>();
const mockOpenSettings = openSettings as jest.Mock;

jest.mock('../SmsReader', () => ({
  smsReader: {
    checkPermissions: mockCheckPermissions,
    requestPermissions: mockRequestPermissions,
  },
}));

const GRANTED_STATUS: SmsPermissionStatus = {
  hasReadSmsPermission: true,
  hasReceiveSmsPermission: true,
};

const DENIED_STATUS: SmsPermissionStatus = {
  hasReadSmsPermission: false,
  hasReceiveSmsPermission: false,
};

const PARTIAL_READ_STATUS: SmsPermissionStatus = {
  hasReadSmsPermission: true,
  hasReceiveSmsPermission: false,
};

const PARTIAL_RECEIVE_STATUS: SmsPermissionStatus = {
  hasReadSmsPermission: false,
  hasReceiveSmsPermission: true,
};

describe('SmsPermissions', () => {
  let smsPermissions: SmsPermissions;

  beforeEach(() => {
    jest.clearAllMocks();
    smsPermissions = new SmsPermissions();
  });

  describe('isFullyGranted', () => {
    it('returns true when both permissions are granted', () => {
      expect(smsPermissions.isFullyGranted(GRANTED_STATUS)).toBe(true);
    });

    it('returns false when only read permission is granted', () => {
      expect(smsPermissions.isFullyGranted(PARTIAL_READ_STATUS)).toBe(false);
    });

    it('returns false when only receive permission is granted', () => {
      expect(smsPermissions.isFullyGranted(PARTIAL_RECEIVE_STATUS)).toBe(false);
    });

    it('returns false when no permissions are granted', () => {
      expect(smsPermissions.isFullyGranted(DENIED_STATUS)).toBe(false);
    });
  });

  describe('checkPermissionState', () => {
    it('returns granted state when fully granted', async () => {
      mockCheckPermissions.mockResolvedValue(GRANTED_STATUS);

      const result = await smsPermissions.checkPermissionState();

      expect(result).toEqual({
        state: 'granted',
        status: GRANTED_STATUS,
        canRetry: false,
      });
    });

    it('returns denied state when no permissions granted', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);

      const result = await smsPermissions.checkPermissionState();

      expect(result).toEqual({
        state: 'denied',
        status: DENIED_STATUS,
        canRetry: true,
      });
    });

    it('returns denied state with partial permissions', async () => {
      mockCheckPermissions.mockResolvedValue(PARTIAL_READ_STATUS);

      const result = await smsPermissions.checkPermissionState();

      expect(result).toEqual({
        state: 'denied',
        status: PARTIAL_READ_STATUS,
        canRetry: true,
      });
    });

    it('updates canRetry based on request count', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      await smsPermissions.requestWithRetry(1);

      const result = await smsPermissions.checkPermissionState();

      expect(result.canRetry).toBe(false);
    });
  });

  describe('requestWithRetry', () => {
    it('returns granted immediately if permissions already granted', async () => {
      mockCheckPermissions.mockResolvedValue(GRANTED_STATUS);

      const result = await smsPermissions.requestWithRetry();

      expect(result).toEqual({
        state: 'granted',
        status: GRANTED_STATUS,
        canRetry: false,
      });
      expect(mockCheckPermissions).toHaveBeenCalledTimes(1);
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('requests permission when not granted', async () => {
      mockCheckPermissions
        .mockResolvedValueOnce(DENIED_STATUS)
        .mockResolvedValueOnce(GRANTED_STATUS);
      mockRequestPermissions.mockResolvedValue(true);

      const result = await smsPermissions.requestWithRetry();

      expect(result).toEqual({
        state: 'granted',
        status: GRANTED_STATUS,
        canRetry: false,
      });
      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });

    it('retries up to maxAttempts', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      const result = await smsPermissions.requestWithRetry(3);

      expect(result).toEqual({
        state: 'blocked',
        status: DENIED_STATUS,
        canRetry: false,
      });
      expect(mockRequestPermissions).toHaveBeenCalledTimes(3);
    });

    it('uses default maxAttempts of 2', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      const result = await smsPermissions.requestWithRetry();

      expect(result.state).toBe('blocked');
      expect(mockRequestPermissions).toHaveBeenCalledTimes(2);
    });

    it('stops retrying once granted', async () => {
      mockCheckPermissions
        .mockResolvedValueOnce(DENIED_STATUS)
        .mockResolvedValueOnce(DENIED_STATUS)
        .mockResolvedValueOnce(GRANTED_STATUS);
      mockRequestPermissions.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      await smsPermissions.requestWithRetry(5);

      expect(mockRequestPermissions).toHaveBeenCalledTimes(2);
    });

    it('returns denied state when partial permissions granted', async () => {
      mockCheckPermissions.mockResolvedValue(PARTIAL_READ_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      const result = await smsPermissions.requestWithRetry(2);

      expect(result).toEqual({
        state: 'denied',
        status: PARTIAL_READ_STATUS,
        canRetry: false,
      });
    });

    it('returns blocked state when all attempts exhausted without any permission', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      const result = await smsPermissions.requestWithRetry(2);

      expect(result.state).toBe('blocked');
    });

    it('resets request count on each call', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      await smsPermissions.requestWithRetry(1);

      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      await smsPermissions.requestWithRetry(2);

      expect(mockRequestPermissions).toHaveBeenCalledTimes(3);
    });

    it('checks permissions after each successful request', async () => {
      mockCheckPermissions
        .mockResolvedValueOnce(DENIED_STATUS)
        .mockResolvedValueOnce(DENIED_STATUS)
        .mockResolvedValueOnce(GRANTED_STATUS);
      mockRequestPermissions.mockResolvedValue(true);

      await smsPermissions.requestWithRetry(2);

      expect(mockCheckPermissions).toHaveBeenCalledTimes(3);
    });

    it('waits between retry attempts', async () => {
      jest.useFakeTimers();
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      const promise = smsPermissions.requestWithRetry(2);

      await jest.advanceTimersByTimeAsync(300);
      await promise;

      jest.useRealTimers();

      expect(mockRequestPermissions).toHaveBeenCalledTimes(2);
    });

    it('handles request permission returning true but permissions not granted', async () => {
      mockCheckPermissions
        .mockResolvedValueOnce(DENIED_STATUS)
        .mockResolvedValueOnce(PARTIAL_READ_STATUS)
        .mockResolvedValueOnce(PARTIAL_READ_STATUS);
      mockRequestPermissions.mockResolvedValue(true);

      const result = await smsPermissions.requestWithRetry(2);

      expect(result.state).toBe('denied');
      expect(mockRequestPermissions).toHaveBeenCalledTimes(2);
    });
  });

  describe('openAppSettings', () => {
    it('calls Linking.openSettings', async () => {
      mockOpenSettings.mockResolvedValue(undefined);

      await smsPermissions.openAppSettings();

      expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('propagates errors from Linking.openSettings', async () => {
      const error = new Error('Failed to open settings');
      mockOpenSettings.mockRejectedValue(error);

      await expect(smsPermissions.openAppSettings()).rejects.toThrow('Failed to open settings');
    });
  });

  describe('resetRequestCount', () => {
    it('resets the internal request count', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      await smsPermissions.requestWithRetry(1);

      const beforeReset = await smsPermissions.checkPermissionState();
      expect(beforeReset.canRetry).toBe(false);

      smsPermissions.resetRequestCount();

      const afterReset = await smsPermissions.checkPermissionState();
      expect(afterReset.canRetry).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles concurrent permission checks', async () => {
      mockCheckPermissions.mockResolvedValue(GRANTED_STATUS);

      await Promise.all([
        smsPermissions.checkPermissionState(),
        smsPermissions.checkPermissionState(),
        smsPermissions.checkPermissionState(),
      ]);

      expect(mockCheckPermissions).toHaveBeenCalledTimes(3);
    });

    it('handles maxAttempts of 0', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);

      const result = await smsPermissions.requestWithRetry(0);

      expect(result.state).toBe('blocked');
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('handles maxAttempts of 1', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockResolvedValue(false);

      await smsPermissions.requestWithRetry(1);

      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });

    it('handles promise rejection from checkPermissions', async () => {
      mockCheckPermissions.mockRejectedValue(new Error('Permission check failed'));

      await expect(smsPermissions.checkPermissionState()).rejects.toThrow(
        'Permission check failed'
      );
    });

    it('handles promise rejection from requestPermissions', async () => {
      mockCheckPermissions.mockResolvedValue(DENIED_STATUS);
      mockRequestPermissions.mockRejectedValue(new Error('Request failed'));

      await expect(smsPermissions.requestWithRetry()).rejects.toThrow('Request failed');
    });
  });
});
