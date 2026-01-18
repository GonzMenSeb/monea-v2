import { Q } from '@nozbe/watermelondb';

import { transactionParser, BANK_INFO } from '@/core/parser';
import { AccountRepository } from '@/infrastructure/database/repositories/AccountRepository';
import {
  TransactionRepository,
  type CreateTransactionData,
} from '@/infrastructure/database/repositories/TransactionRepository';
import { smsReader } from '@/infrastructure/sms/SmsReader';

import type { BankCode, ParsedTransaction } from '@/core/parser';
import type Account from '@/infrastructure/database/models/Account';
import type { AccountType } from '@/infrastructure/database/models/Account';
import type SmsMessage from '@/infrastructure/database/models/SmsMessage';
import type { ParsedSmsMessage } from '@/infrastructure/sms/types';
import type { Database } from '@nozbe/watermelondb';

export interface SyncResult {
  processed: number;
  created: number;
  skipped: number;
  errors: SyncError[];
}

export interface SyncError {
  smsId?: string;
  message: string;
  rawSms: string;
}

export interface SmsSyncServiceInterface {
  processMessage(message: ParsedSmsMessage): Promise<ProcessResult>;
  startRealtimeSync(): void;
  stopRealtimeSync(): void;
  isRunning(): boolean;
}

export type ProcessResult =
  | { success: true; transactionId: string; accountId: string }
  | {
      success: false;
      reason: 'not_bank_sms' | 'parse_failed' | 'duplicate' | 'storage_error';
      error?: string;
    };

type MessageListener = (result: ProcessResult) => void;
type ErrorListener = (error: Error) => void;

function inferAccountType(bankCode: BankCode): AccountType {
  if (bankCode === 'nequi' || bankCode === 'daviplata') {
    return 'digital_wallet';
  }
  return 'savings';
}

export class SmsSyncService implements SmsSyncServiceInterface {
  private accountRepo: AccountRepository;
  private transactionRepo: TransactionRepository;
  private smsCollection;
  private running = false;
  private messageListeners: MessageListener[] = [];
  private errorListeners: ErrorListener[] = [];

  constructor(private database: Database) {
    this.accountRepo = new AccountRepository(database);
    this.transactionRepo = new TransactionRepository(database);
    this.smsCollection = database.get<SmsMessage>('sms_messages');
  }

  async processMessage(message: ParsedSmsMessage): Promise<ProcessResult> {
    const parseOutcome = transactionParser.parse(message.body, message.sender);

    if (!parseOutcome.success) {
      return { success: false, reason: 'not_bank_sms', error: parseOutcome.error };
    }

    const result = parseOutcome;
    const smsRecord = await this.storeSmsMessage(message);

    const existingTx = await this.transactionRepo.findBySmsId(smsRecord.id);
    if (existingTx) {
      await this.markSmsProcessed(smsRecord.id, true);
      return { success: false, reason: 'duplicate' };
    }

    try {
      const account = await this.findOrCreateAccount(
        result.bank.code,
        result.transaction.accountNumber
      );

      const transactionData = this.buildTransactionData(
        result.transaction,
        account.id,
        smsRecord.id,
        message.rawMessage
      );

      const transaction = await this.transactionRepo.create(transactionData);

      if (result.transaction.balanceAfter !== undefined) {
        await this.accountRepo.updateBalance(account.id, result.transaction.balanceAfter);
      }

      await this.accountRepo.updateLastSynced(account.id);
      await this.markSmsProcessed(smsRecord.id, true);

      return { success: true, transactionId: transaction.id, accountId: account.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await this.markSmsProcessed(smsRecord.id, false, errorMessage);
      return { success: false, reason: 'storage_error', error: errorMessage };
    }
  }

  startRealtimeSync(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    smsReader.startListening(
      (message) => {
        this.processMessage(message)
          .then((result) => {
            this.notifyMessageListeners(result);
          })
          .catch((err) => {
            this.notifyErrorListeners(err instanceof Error ? err : new Error(String(err)));
          });
      },
      (error) => {
        this.notifyErrorListeners(error instanceof Error ? error : new Error(String(error)));
      }
    );
  }

  stopRealtimeSync(): void {
    if (!this.running) {
      return;
    }

    smsReader.stopListening();
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }

  onError(listener: ErrorListener): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== listener);
    };
  }

  async getUnprocessedSmsCount(): Promise<number> {
    return this.smsCollection.query(Q.where('is_processed', false)).fetchCount();
  }

  async reprocessFailedMessages(): Promise<SyncResult> {
    const failedMessages = await this.smsCollection
      .query(Q.where('is_processed', true), Q.where('processing_error', Q.notEq(null)))
      .fetch();

    const result: SyncResult = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const sms of failedMessages) {
      result.processed++;

      const message: ParsedSmsMessage = {
        sender: sms.address,
        body: sms.body,
        rawMessage: `[${sms.address}, ${sms.body}]`,
      };

      await this.resetSmsProcessingStatus(sms.id);

      const processResult = await this.processMessage(message);

      if (processResult.success) {
        result.created++;
      } else if (processResult.reason === 'duplicate') {
        result.skipped++;
      } else {
        result.errors.push({
          smsId: sms.id,
          message: processResult.error ?? processResult.reason,
          rawSms: message.rawMessage,
        });
      }
    }

    return result;
  }

  private async storeSmsMessage(message: ParsedSmsMessage): Promise<SmsMessage> {
    const existing = await this.findExistingSms(message);
    if (existing) {
      return existing;
    }

    return this.database.write(async () => {
      return this.smsCollection.create((sms) => {
        sms.address = message.sender;
        sms.body = message.body;
        sms.date = new Date();
        sms.isProcessed = false;
      });
    });
  }

  private async findExistingSms(message: ParsedSmsMessage): Promise<SmsMessage | null> {
    const results = await this.smsCollection
      .query(Q.where('address', message.sender), Q.where('body', message.body))
      .fetch();

    return results[0] ?? null;
  }

  private async markSmsProcessed(
    smsId: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const sms = await this.smsCollection.find(smsId);
    await this.database.write(async () => {
      await sms.update((s) => {
        s.isProcessed = true;
        if (!success && errorMessage) {
          s.processingError = errorMessage;
        } else {
          s.processingError = undefined;
        }
      });
    });
  }

  private async resetSmsProcessingStatus(smsId: string): Promise<void> {
    const sms = await this.smsCollection.find(smsId);
    await this.database.write(async () => {
      await sms.update((s) => {
        s.isProcessed = false;
        s.processingError = undefined;
      });
    });
  }

  private async findOrCreateAccount(bankCode: BankCode, accountNumber?: string): Promise<Account> {
    const normalizedAccountNum = accountNumber ?? 'unknown';

    const existingAccounts = await this.accountRepo.findByBankCode(bankCode);
    const matchingAccount = existingAccounts.find(
      (acc) => acc.accountNumber === normalizedAccountNum
    );

    if (matchingAccount) {
      return matchingAccount;
    }

    const bankInfo = BANK_INFO[bankCode];

    return this.accountRepo.create({
      bankCode,
      bankName: bankInfo.name,
      accountNumber: normalizedAccountNum,
      accountType: inferAccountType(bankCode),
      balance: 0,
      isActive: true,
    });
  }

  private buildTransactionData(
    parsed: ParsedTransaction,
    accountId: string,
    smsId: string,
    rawSms: string
  ): CreateTransactionData {
    return {
      accountId,
      type: parsed.type,
      amount: parsed.amount,
      transactionDate: parsed.transactionDate,
      balanceAfter: parsed.balanceAfter,
      merchant: parsed.merchant,
      description: parsed.description,
      reference: parsed.reference,
      smsId,
      rawSms,
    };
  }

  private notifyMessageListeners(result: ProcessResult): void {
    for (const listener of this.messageListeners) {
      try {
        listener(result);
      } catch {
        // Listener errors should not affect other listeners
      }
    }
  }

  private notifyErrorListeners(error: Error): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch {
        // Listener errors should not affect other listeners
      }
    }
  }
}

let smsSyncServiceInstance: SmsSyncService | null = null;

export function getSmsSyncService(database: Database): SmsSyncService {
  if (!smsSyncServiceInstance) {
    smsSyncServiceInstance = new SmsSyncService(database);
  }
  return smsSyncServiceInstance;
}

export function resetSmsSyncService(): void {
  if (smsSyncServiceInstance) {
    smsSyncServiceInstance.stopRealtimeSync();
    smsSyncServiceInstance = null;
  }
}
