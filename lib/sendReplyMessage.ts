// lib/sendReplyMessage.ts
import { client } from './init/line';

export const sendReplyMessage = async (replyToken: string, message: string) => {
  try {
    await client.replyMessage(replyToken, {
      type: 'text',
      text: message
    });
    console.log(`Sent reply: ${message}`);
  } catch (error) {
    console.error('Error sending reply message:', error);
  }
};
