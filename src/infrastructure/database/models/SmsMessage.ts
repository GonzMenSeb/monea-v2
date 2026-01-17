import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class SmsMessage extends Model {
  static table = 'sms_messages';

  @field('address') address!: string;
  @field('body') body!: string;
  @date('date') date!: Date;
  @field('is_processed') isProcessed!: boolean;
  @field('processing_error') processingError?: string;
  @readonly @date('created_at') createdAt!: Date;
}
