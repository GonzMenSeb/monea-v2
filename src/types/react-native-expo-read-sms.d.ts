declare module '@maniac-tech/react-native-expo-read-sms' {
  export interface SmsPermissionResult {
    hasReceiveSmsPermission: boolean;
    hasReadSmsPermission: boolean;
  }

  export function checkIfHasSMSPermission(): Promise<SmsPermissionResult>;

  export function requestReadSMSPermission(): Promise<boolean>;

  export function startReadSMS(
    successCallback: (message: string) => void,
    errorCallback: (error: string | Error) => void
  ): void;
}
