import { MessageEvent } from '@line/bot-sdk';
import { sendPeriodSettingMessage } from './sendPeriodSettingMessage';
import { sendReplyMessage } from './sendReplyMessage';

export const handleMessage = async (event: MessageEvent) => {
  const replyToken = event.replyToken;
  const messageText = event.message.type === 'text' ? event.message.text : '';

  if (messageText === '保存期間変更') {
    await sendPeriodSettingMessage(replyToken);
  }
};
