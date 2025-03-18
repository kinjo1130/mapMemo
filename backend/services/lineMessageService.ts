// services/lineMessageService.ts
import { sendReplyMessage } from '@/lib/sendReplyMessage';
import { sendPeriodSettingMessage } from '@/lib/sendPeriodSettingMessage';
import { handlePostbackEvent } from '@/lib/handlePostbackEvent';
import { WebhookEvent } from '@line/bot-sdk';

class LineMessageService {
  /**
   * 返信メッセージを送信する
   */
  async sendReplyMessage(replyToken: string, message: string): Promise<void> {
    return await sendReplyMessage(replyToken, message);
  }
  
  /**
   * 期間設定メッセージを送信する
   */
  async sendPeriodSettingMessage(replyToken: string): Promise<void> {
    return await sendPeriodSettingMessage(replyToken);
  }
  
  /**
   * ポストバックイベントを処理する
   */
  async handlePostbackEvent(event: WebhookEvent & { type: 'postback' }): Promise<void> {
    return await handlePostbackEvent(event);
  }
}

export const lineMessageService = new LineMessageService();