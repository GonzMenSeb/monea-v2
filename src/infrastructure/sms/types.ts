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

export interface HistoricalSmsOptions {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  senders?: string[];
}

export interface HistoricalSmsMessage {
  id: string;
  sender: string;
  body: string;
  date: Date;
}

export interface SmsReaderInterface {
  checkPermissions(): Promise<SmsPermissionStatus>;
  requestPermissions(): Promise<boolean>;
  startListening(onMessage: ParsedSmsCallback, onError: SmsErrorCallback): void;
  stopListening(): void;
  isListening(): boolean;
  fetchHistoricalSms(options?: HistoricalSmsOptions): Promise<HistoricalSmsMessage[]>;
  getInboxCount(): Promise<number>;
}
