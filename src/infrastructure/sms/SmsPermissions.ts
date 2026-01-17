import * as Linking from 'expo-linking';

import { smsReader } from './SmsReader';

import type { SmsPermissionStatus } from './types';

export type PermissionState = 'unknown' | 'checking' | 'granted' | 'denied' | 'blocked';

export interface PermissionResult {
  state: PermissionState;
  status: SmsPermissionStatus;
  canRetry: boolean;
}

export interface SmsPermissionsInterface {
  checkPermissionState(): Promise<PermissionResult>;
  requestWithRetry(maxAttempts?: number): Promise<PermissionResult>;
  openAppSettings(): Promise<void>;
  isFullyGranted(status: SmsPermissionStatus): boolean;
}

const DEFAULT_MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function determinePermissionState(status: SmsPermissionStatus): PermissionState {
  if (status.hasReadSmsPermission && status.hasReceiveSmsPermission) {
    return 'granted';
  }
  return 'denied';
}

class SmsPermissions implements SmsPermissionsInterface {
  private requestCount = 0;

  isFullyGranted(status: SmsPermissionStatus): boolean {
    return status.hasReadSmsPermission && status.hasReceiveSmsPermission;
  }

  async checkPermissionState(): Promise<PermissionResult> {
    const status = await smsReader.checkPermissions();
    const state = determinePermissionState(status);

    return {
      state,
      status,
      canRetry: state === 'denied' && this.requestCount < DEFAULT_MAX_ATTEMPTS,
    };
  }

  async requestWithRetry(maxAttempts: number = DEFAULT_MAX_ATTEMPTS): Promise<PermissionResult> {
    this.requestCount = 0;

    while (this.requestCount < maxAttempts) {
      const currentStatus = await smsReader.checkPermissions();

      if (this.isFullyGranted(currentStatus)) {
        return {
          state: 'granted',
          status: currentStatus,
          canRetry: false,
        };
      }

      this.requestCount++;
      const granted = await smsReader.requestPermissions();

      if (granted) {
        const finalStatus = await smsReader.checkPermissions();
        if (this.isFullyGranted(finalStatus)) {
          return {
            state: 'granted',
            status: finalStatus,
            canRetry: false,
          };
        }
      }

      if (this.requestCount < maxAttempts) {
        await delay(RETRY_DELAY_MS);
      }
    }

    const finalStatus = await smsReader.checkPermissions();
    const hasPartialPermission =
      finalStatus.hasReadSmsPermission || finalStatus.hasReceiveSmsPermission;

    return {
      state: hasPartialPermission ? 'denied' : 'blocked',
      status: finalStatus,
      canRetry: false,
    };
  }

  async openAppSettings(): Promise<void> {
    await Linking.openSettings();
  }

  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

export const smsPermissions = new SmsPermissions();
export { SmsPermissions };
