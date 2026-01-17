import {
  startReadSMS,
  checkIfHasSMSPermission,
  requestReadSMSPermission,
} from '@maniac-tech/react-native-expo-read-sms';

import { SmsReader } from '../SmsReader';

import type { ParsedSmsMessage } from '../types';

const mockStartReadSMS = startReadSMS as jest.Mock;
const mockCheckIfHasSMSPermission = checkIfHasSMSPermission as jest.Mock;
const mockRequestReadSMSPermission = requestReadSMSPermission as jest.Mock;

describe('SmsReader', () => {
  let smsReader: SmsReader;

  beforeEach(() => {
    jest.clearAllMocks();
    smsReader = new SmsReader();
  });

  describe('checkPermissions', () => {
    it('returns permission status from native module', async () => {
      mockCheckIfHasSMSPermission.mockResolvedValue({
        hasReceiveSmsPermission: true,
        hasReadSmsPermission: true,
      });

      const result = await smsReader.checkPermissions();

      expect(result).toEqual({
        hasReceiveSmsPermission: true,
        hasReadSmsPermission: true,
      });
      expect(mockCheckIfHasSMSPermission).toHaveBeenCalledTimes(1);
    });

    it('returns partial permissions', async () => {
      mockCheckIfHasSMSPermission.mockResolvedValue({
        hasReceiveSmsPermission: true,
        hasReadSmsPermission: false,
      });

      const result = await smsReader.checkPermissions();

      expect(result).toEqual({
        hasReceiveSmsPermission: true,
        hasReadSmsPermission: false,
      });
    });

    it('returns denied permissions', async () => {
      mockCheckIfHasSMSPermission.mockResolvedValue({
        hasReceiveSmsPermission: false,
        hasReadSmsPermission: false,
      });

      const result = await smsReader.checkPermissions();

      expect(result).toEqual({
        hasReceiveSmsPermission: false,
        hasReadSmsPermission: false,
      });
    });
  });

  describe('requestPermissions', () => {
    it('returns true when permission is granted', async () => {
      mockRequestReadSMSPermission.mockResolvedValue(true);

      const result = await smsReader.requestPermissions();

      expect(result).toBe(true);
      expect(mockRequestReadSMSPermission).toHaveBeenCalledTimes(1);
    });

    it('returns false when permission is denied', async () => {
      mockRequestReadSMSPermission.mockResolvedValue(false);

      const result = await smsReader.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when both permissions are granted', async () => {
      mockCheckIfHasSMSPermission.mockResolvedValue({
        hasReceiveSmsPermission: true,
        hasReadSmsPermission: true,
      });

      const result = await smsReader.hasAllPermissions();

      expect(result).toBe(true);
    });

    it('returns false when only receive permission is granted', async () => {
      mockCheckIfHasSMSPermission.mockResolvedValue({
        hasReceiveSmsPermission: true,
        hasReadSmsPermission: false,
      });

      const result = await smsReader.hasAllPermissions();

      expect(result).toBe(false);
    });

    it('returns false when only read permission is granted', async () => {
      mockCheckIfHasSMSPermission.mockResolvedValue({
        hasReceiveSmsPermission: false,
        hasReadSmsPermission: true,
      });

      const result = await smsReader.hasAllPermissions();

      expect(result).toBe(false);
    });

    it('returns false when no permissions are granted', async () => {
      mockCheckIfHasSMSPermission.mockResolvedValue({
        hasReceiveSmsPermission: false,
        hasReadSmsPermission: false,
      });

      const result = await smsReader.hasAllPermissions();

      expect(result).toBe(false);
    });
  });

  describe('startListening', () => {
    it('starts listening and sets listening state to true', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);

      expect(smsReader.isListening()).toBe(true);
      expect(mockStartReadSMS).toHaveBeenCalledTimes(1);
    });

    it('calls error callback when already listening', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);
      smsReader.startListening(onMessage, onError);

      expect(onError).toHaveBeenCalledWith(new Error('SMS listener is already active'));
      expect(mockStartReadSMS).toHaveBeenCalledTimes(1);
    });

    it('parses valid SMS message format', () => {
      const onMessage = jest.fn<void, [ParsedSmsMessage]>();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);

      const mockCalls = mockStartReadSMS.mock.calls as Array<
        [(msg: string) => void, (err: string | Error) => void]
      >;
      const mockSuccessCallback = mockCalls[0]?.[0];
      if (mockSuccessCallback) {
        mockSuccessCallback('[BANCOLOMBIA, Tu transaccion fue exitosa]');
      }

      expect(onMessage).toHaveBeenCalledWith({
        sender: 'BANCOLOMBIA',
        body: 'Tu transaccion fue exitosa',
        rawMessage: '[BANCOLOMBIA, Tu transaccion fue exitosa]',
      });
    });

    it('parses SMS with multiline body', () => {
      const onMessage = jest.fn<void, [ParsedSmsMessage]>();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);

      const mockCalls = mockStartReadSMS.mock.calls as Array<
        [(msg: string) => void, (err: string | Error) => void]
      >;
      const mockSuccessCallback = mockCalls[0]?.[0];
      if (mockSuccessCallback) {
        mockSuccessCallback('[NEQUI, Recibiste $50.000\nDesde: Juan\nSaldo: $100.000]');
      }

      expect(onMessage).toHaveBeenCalledWith({
        sender: 'NEQUI',
        body: 'Recibiste $50.000\nDesde: Juan\nSaldo: $100.000',
        rawMessage: '[NEQUI, Recibiste $50.000\nDesde: Juan\nSaldo: $100.000]',
      });
    });

    it('handles malformed SMS message', () => {
      const onMessage = jest.fn<void, [ParsedSmsMessage]>();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);

      const mockCalls = mockStartReadSMS.mock.calls as Array<
        [(msg: string) => void, (err: string | Error) => void]
      >;
      const mockSuccessCallback = mockCalls[0]?.[0];
      if (mockSuccessCallback) {
        mockSuccessCallback('Invalid message format');
      }

      expect(onMessage).toHaveBeenCalledWith({
        sender: 'Unknown',
        body: 'Invalid message format',
        rawMessage: 'Invalid message format',
      });
    });

    it('handles SMS with empty sender', () => {
      const onMessage = jest.fn<void, [ParsedSmsMessage]>();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);

      const mockCalls = mockStartReadSMS.mock.calls as Array<
        [(msg: string) => void, (err: string | Error) => void]
      >;
      const mockSuccessCallback = mockCalls[0]?.[0];
      if (mockSuccessCallback) {
        mockSuccessCallback('[, Message body]');
      }

      expect(onMessage).toHaveBeenCalledWith({
        sender: '',
        body: 'Message body',
        rawMessage: '[, Message body]',
      });
    });

    it('forwards string errors as Error objects', () => {
      const onMessage = jest.fn();
      const onError = jest.fn<void, [Error]>();

      smsReader.startListening(onMessage, onError);

      const mockCalls = mockStartReadSMS.mock.calls as Array<
        [(msg: string) => void, (err: string | Error) => void]
      >;
      const mockErrorCallback = mockCalls[0]?.[1];
      if (mockErrorCallback) {
        mockErrorCallback('Permission denied');
      }

      expect(onError).toHaveBeenCalledWith(new Error('Permission denied'));
    });

    it('forwards Error objects directly', () => {
      const onMessage = jest.fn();
      const onError = jest.fn<void, [Error]>();
      const error = new Error('Native module error');

      smsReader.startListening(onMessage, onError);

      const mockCalls = mockStartReadSMS.mock.calls as Array<
        [(msg: string) => void, (err: string | Error) => void]
      >;
      const mockErrorCallback = mockCalls[0]?.[1];
      if (mockErrorCallback) {
        mockErrorCallback(error);
      }

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('does not call callbacks after stopListening', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);
      smsReader.stopListening();

      const mockCalls = mockStartReadSMS.mock.calls as Array<
        [(msg: string) => void, (err: string | Error) => void]
      >;
      const mockSuccessCallback = mockCalls[0]?.[0];
      if (mockSuccessCallback) {
        mockSuccessCallback('[BANCOLOMBIA, Test message]');
      }

      expect(onMessage).not.toHaveBeenCalled();
    });
  });

  describe('stopListening', () => {
    it('sets listening state to false', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);
      expect(smsReader.isListening()).toBe(true);

      smsReader.stopListening();
      expect(smsReader.isListening()).toBe(false);
    });

    it('clears callbacks', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);
      smsReader.stopListening();

      const mockCalls = mockStartReadSMS.mock.calls as Array<
        [(msg: string) => void, (err: string | Error) => void]
      >;
      const mockSuccessCallback = mockCalls[0]?.[0];
      const mockErrorCallback = mockCalls[0]?.[1];

      if (mockSuccessCallback) {
        mockSuccessCallback('[TEST, Message]');
      }
      if (mockErrorCallback) {
        mockErrorCallback('Error');
      }

      expect(onMessage).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('can be called multiple times safely', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);
      smsReader.stopListening();
      smsReader.stopListening();

      expect(smsReader.isListening()).toBe(false);
    });

    it('allows starting again after stopping', () => {
      const onMessage1 = jest.fn();
      const onError1 = jest.fn();

      smsReader.startListening(onMessage1, onError1);
      smsReader.stopListening();

      const onMessage2 = jest.fn();
      const onError2 = jest.fn();

      smsReader.startListening(onMessage2, onError2);

      expect(smsReader.isListening()).toBe(true);
      expect(mockStartReadSMS).toHaveBeenCalledTimes(2);
    });
  });

  describe('isListening', () => {
    it('returns false initially', () => {
      expect(smsReader.isListening()).toBe(false);
    });

    it('returns true after startListening', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);

      expect(smsReader.isListening()).toBe(true);
    });

    it('returns false after stopListening', () => {
      const onMessage = jest.fn();
      const onError = jest.fn();

      smsReader.startListening(onMessage, onError);
      smsReader.stopListening();

      expect(smsReader.isListening()).toBe(false);
    });
  });
});
