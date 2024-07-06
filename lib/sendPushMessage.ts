import { Message } from '@line/bot-sdk';
// 開発用のkey
const CHANNEL_ACCESS_TOKEN = 'Nh7io2CJ+i05dJmt9PRPHgMTsV27kpQLWADqKNC2YCn5gIjl/EyvkVeUBVg+BXSxKJG7wDEyQ58ZJ+R4qAMk6wf3tYQvd+jREiauTvpnGENNyIcO6hIHC3KywLMJVrTq9XrdF4dJZvPhj1M/N52NRAdB04t89/1O/w1cDnyilFU='

interface PushMessageParams {
  to: string; // groupId or userId(送信したいところのID)
  message: string;
  quoteToken?: string;
}

export const sendPushMessage = async ({ to, message, quoteToken }: PushMessageParams): Promise<void> => {
  const url = 'https://api.line.me/v2/bot/message/push';
  console.log('Sending push message:', to, message, CHANNEL_ACCESS_TOKEN);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  };

  const messageObject: Message = {
    type: 'text',
    text: message
  };

  if (quoteToken) {
    (messageObject as any).quoteToken = quoteToken;
  }

  const data = {
    to,
    messages: [messageObject]
  };
  console.log('data', data);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Push message sent successfully:', result);
  } catch (error) {
    console.error('Error sending push message:', error);
    throw error;
  }
};