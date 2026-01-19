declare module 'react-native-get-sms-android' {
  export interface SmsFilter {
    box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued' | '';
    minDate?: number;
    maxDate?: number;
    bodyRegex?: string;
    read?: 0 | 1;
    indexFrom?: number;
    maxCount?: number;
    address?: string;
  }

  export interface SmsMessage {
    _id: string;
    thread_id: string;
    address: string;
    person: string;
    date: string;
    date_sent: string;
    protocol: string;
    read: string;
    status: string;
    type: string;
    body: string;
    service_center: string;
    locked: string;
    error_code: string;
    sub_id: string;
    seen: string;
    deletable: string;
    sim_slot: string;
    hidden: string;
    app_id: string;
    msg_id: string;
    reserved: string;
    pri: string;
    teleservice_id: string;
    link_url: string;
  }

  export type ErrorCallback = (error: string) => void;
  export type SuccessCallback = (count: number, smsList: string) => void;

  function list(
    filter: SmsFilter | string,
    errorCallback: ErrorCallback,
    successCallback: SuccessCallback
  ): void;

  export default { list };
}
