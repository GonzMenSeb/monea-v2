import {
  startReadSMS,
  checkIfHasSMSPermission,
  requestReadSMSPermission,
} from '@maniac-tech/react-native-expo-read-sms';

import type {
  SmsPermissionStatus,
  ParsedSmsMessage,
  ParsedSmsCallback,
  SmsErrorCallback,
  SmsReaderInterface,
} from './types';

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
}

export const smsReader = new SmsReader();
export { SmsReader };
