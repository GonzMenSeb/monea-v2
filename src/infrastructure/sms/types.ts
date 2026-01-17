export interface SmsPermissionStatus {
  hasReceiveSmsPermission: boolean;
  hasReadSmsPermission: boolean;
}

export interface ParsedSmsMessage {
  sender: string;
  body: string;
  rawMessage: string;
}

export type SmsSuccessCallback = (message: string) => void;
export type SmsErrorCallback = (error: Error | string) => void;
export type ParsedSmsCallback = (message: ParsedSmsMessage) => void;

export interface SmsReaderInterface {
  checkPermissions(): Promise<SmsPermissionStatus>;
  requestPermissions(): Promise<boolean>;
  startListening(onMessage: ParsedSmsCallback, onError: SmsErrorCallback): void;
  stopListening(): void;
  isListening(): boolean;
}
