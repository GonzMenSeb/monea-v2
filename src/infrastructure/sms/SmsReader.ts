import {
  startReadSMS,
  checkIfHasSMSPermission,
  requestReadSMSPermission,
} from '@maniac-tech/react-native-expo-read-sms';
// eslint-disable-next-line import/default
import SmsAndroid from 'react-native-get-sms-android';

import type {
  SmsPermissionStatus,
  ParsedSmsMessage,
  ParsedSmsCallback,
  SmsErrorCallback,
  SmsReaderInterface,
  HistoricalSmsOptions,
  HistoricalSmsMessage,
} from './types';
import type { SmsFilter, SmsMessage } from 'react-native-get-sms-android';

function parseRawSmsMessage(rawMessage: string): ParsedSmsMessage {
  const match = rawMessage.match(/^\[([^\],]*),\s*(.+)\]$/s);

  if (match && match[1] !== undefined && match[2] !== undefined) {
    return {
      sender: match[1].trim(),
      body: match[2].trim(),
      rawMessage,
    };
  }

  return {
    sender: 'Unknown',
    body: rawMessage,
    rawMessage,
  };
}

class SmsReader implements SmsReaderInterface {
  private listening = false;
  private currentCallback: ParsedSmsCallback | null = null;
  private currentErrorCallback: SmsErrorCallback | null = null;

  async checkPermissions(): Promise<SmsPermissionStatus> {
    const result = await checkIfHasSMSPermission();
    return {
      hasReceiveSmsPermission: result.hasReceiveSmsPermission,
      hasReadSmsPermission: result.hasReadSmsPermission,
    };
  }

  async requestPermissions(): Promise<boolean> {
    return requestReadSMSPermission();
  }

  async hasAllPermissions(): Promise<boolean> {
    const status = await this.checkPermissions();
    return status.hasReadSmsPermission && status.hasReceiveSmsPermission;
  }

  startListening(onMessage: ParsedSmsCallback, onError: SmsErrorCallback): void {
    if (this.listening) {
      onError(new Error('SMS listener is already active'));
      return;
    }

    this.currentCallback = onMessage;
    this.currentErrorCallback = onError;
    this.listening = true;

    startReadSMS(
      (rawMessage: string) => {
        if (this.currentCallback) {
          const parsed = parseRawSmsMessage(rawMessage);
          this.currentCallback(parsed);
        }
      },
      (error: string | Error) => {
        if (this.currentErrorCallback) {
          this.currentErrorCallback(typeof error === 'string' ? new Error(error) : error);
        }
      }
    );
  }

  stopListening(): void {
    this.listening = false;
    this.currentCallback = null;
    this.currentErrorCallback = null;
  }

  isListening(): boolean {
    return this.listening;
  }

  async fetchHistoricalSms(options?: HistoricalSmsOptions): Promise<HistoricalSmsMessage[]> {
    const hasPermissions = await this.hasAllPermissions();
    if (!hasPermissions) {
      throw new Error('SMS permissions not granted');
    }

    return new Promise((resolve, reject) => {
      const filter: SmsFilter = {
        box: 'inbox',
        maxCount: options?.limit ?? 1000,
      };

      if (options?.startDate) {
        filter.minDate = options.startDate.getTime();
      }

      if (options?.endDate) {
        filter.maxDate = options.endDate.getTime();
      }

      try {
        SmsAndroid.list(
          JSON.stringify(filter),
          (error: string) => {
            reject(new Error(error));
          },
          (_count: number, smsList: string) => {
            try {
              const messages = JSON.parse(smsList) as SmsMessage[];

              const historicalMessages: HistoricalSmsMessage[] = messages.map((m) => ({
                id: m._id,
                sender: m.address,
                body: m.body,
                date: new Date(parseInt(m.date, 10)),
              }));

              resolve(historicalMessages);
            } catch {
              reject(new Error('Failed to parse SMS messages'));
            }
          }
        );
      } catch (syncError) {
        reject(syncError instanceof Error ? syncError : new Error(String(syncError)));
      }
    });
  }

  async getInboxCount(): Promise<number> {
    const hasPermissions = await this.hasAllPermissions();
    if (!hasPermissions) {
      return 0;
    }

    return new Promise((resolve) => {
      const filter: SmsFilter = {
        box: 'inbox',
        maxCount: 1,
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        (_error: string) => {
          resolve(0);
        },
        (count: number, _smsList: string) => {
          resolve(count);
        }
      );
    });
  }
}

export const smsReader = new SmsReader();
export { SmsReader };
