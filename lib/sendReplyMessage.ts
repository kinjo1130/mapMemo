import { client } from './init/line';
import { Message, FlexMessage } from '@line/bot-sdk';

export const sendReplyMessage = async (replyToken: string, message: string) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const liffUrl = isDev ? process.env.LIFF_URL_DEV : process.env.LIFF_URL_PROD;

    const flexMessage: FlexMessage = {
      type: 'flex',
      altText: 'LIFF URLを開く',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: message,
              wrap: true,
              weight: 'bold',
              size: 'md'
            },
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '一覧でみる',
                uri: liffUrl || ''
              },
              style: 'primary',
              color: '#1DB446'
            }
          ]
        }
      }
    };

    await client.replyMessage(replyToken, flexMessage);
    console.log(`Sent reply: ${message} with LIFF URL: ${liffUrl}`);
  } catch (error) {
    console.error('Error sending reply message:', error);
  }
};
