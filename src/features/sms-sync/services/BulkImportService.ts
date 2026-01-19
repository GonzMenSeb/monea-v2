import { InteractionManager } from 'react-native';

import { detectBankFromContent } from '@/core/parser';
import { database } from '@/infrastructure/database';
import { smsReader } from '@/infrastructure/sms';

import { getSmsSyncService } from './SmsSyncService';

import type {
  HistoricalSmsOptions,
  HistoricalSmsMessage,
  ParsedSmsMessage,
} from '@/infrastructure/sms';

export interface BulkImportProgress {
  phase: 'preparing' | 'importing' | 'complete';
  current: number;
  total: number;
  newTransactions: number;
  duplicates: number;
  errors: number;
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
}

export type ProgressCallback = (progress: BulkImportProgress) => void;

const BATCH_SIZE = 50;

export class BulkImportService {
  private cancelled = false;

  cancel(): void {
    this.cancelled = true;
  }

  async getEstimatedCount(): Promise<number> {
    const messages = await smsReader.fetchHistoricalSms({ limit: 5000 });
    let count = 0;
    for (const msg of messages) {
      if (detectBankFromContent(msg.body)) {
        count++;
      }
    }
    return count;
  }

  async importHistoricalSms(
    options?: HistoricalSmsOptions,
    onProgress?: ProgressCallback
  ): Promise<BulkImportResult> {
    this.cancelled = false;

    const result: BulkImportResult = {
      success: true,
      imported: 0,
      duplicates: 0,
      errors: 0,
      errorMessages: [],
    };

    onProgress?.({
      phase: 'preparing',
      current: 0,
      total: 0,
      newTransactions: 0,
      duplicates: 0,
      errors: 0,
    });

    const fetchOptions: HistoricalSmsOptions = {
      ...options,
      limit: options?.limit ?? 5000,
    };

    let messages: HistoricalSmsMessage[];
    try {
      messages = await smsReader.fetchHistoricalSms(fetchOptions);
    } catch (error) {
      result.success = false;
      result.errorMessages.push(
        error instanceof Error ? error.message : 'Failed to fetch SMS messages'
      );
      return result;
    }

    if (messages.length === 0) {
      onProgress?.({
        phase: 'complete',
        current: 0,
        total: 0,
        newTransactions: 0,
        duplicates: 0,
        errors: 0,
      });
      return result;
    }

    messages.sort((a, b) => a.date.getTime() - b.date.getTime());

    const syncService = getSmsSyncService(database);
    const total = messages.length;

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      if (this.cancelled) {
        break;
      }

      const batch = messages.slice(i, i + BATCH_SIZE);

      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => resolve());
      });

      for (const smsMessage of batch) {
        if (this.cancelled) {
          break;
        }

        const parsedMessage: ParsedSmsMessage = {
          sender: smsMessage.sender,
          body: smsMessage.body,
          rawMessage: `[${smsMessage.sender}, ${smsMessage.body}]`,
        };

        try {
          const processResult = await syncService.processMessage(parsedMessage);

          if (processResult.success) {
            result.imported++;
          } else if (processResult.reason === 'duplicate') {
            result.duplicates++;
          } else if (processResult.reason !== 'not_bank_sms') {
            result.errors++;
            if (processResult.error) {
              result.errorMessages.push(processResult.error);
            }
          }
        } catch (error) {
          result.errors++;
          result.errorMessages.push(
            error instanceof Error ? error.message : 'Unknown processing error'
          );
        }
      }

      onProgress?.({
        phase: 'importing',
        current: Math.min(i + BATCH_SIZE, total),
        total,
        newTransactions: result.imported,
        duplicates: result.duplicates,
        errors: result.errors,
      });
    }

    onProgress?.({
      phase: 'complete',
      current: total,
      total,
      newTransactions: result.imported,
      duplicates: result.duplicates,
      errors: result.errors,
    });

    result.success = result.errors === 0 || result.imported > 0;
    return result;
  }
}

export const bulkImportService = new BulkImportService();
