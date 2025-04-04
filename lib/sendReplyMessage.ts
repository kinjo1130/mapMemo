// lib/sendReplyMessage.ts
import { client } from './init/line';
import { Message } from '@line/bot-sdk';

export const sendReplyMessage = async (replyToken: string, message: string | Message) => {
  try {
    // 文字列の場合はテキストメッセージとして扱う
  const messageObj = typeof message === 'string'
  ? { type: 'text', text: message } as Message
  : message;
    await client.replyMessage(replyToken, messageObj);
    console.log(`Sent reply: ${message}`);
  } catch (error) {
    console.error('Error sending reply message:', error);
  }
};
