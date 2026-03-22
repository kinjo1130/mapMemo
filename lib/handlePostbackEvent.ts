import { PostbackEvent } from '@line/bot-sdk';
import { sendReplyMessage } from './sendReplyMessage';
import { handleUserPeriodPostback } from './handleUserPeriodPostback';
import { handlePlaceConfirmPostback } from './handlePlaceConfirmPostback';

// 型ガードを使用して inputOption プロパティが存在するか確認する
const hasInputOption = (postback: any): postback is { inputOption: string } => {
  return 'inputOption' in postback;
};

const parsePostbackData = (data: string): Record<string, string> => {
  const params: Record<string, string> = {};
  data.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) params[key] = value;
  });
  return params;
};

export const handlePostbackEvent = async (event: PostbackEvent) => {
  const data = event.postback.data;

  try {
    if (hasInputOption(event.postback) && event.postback.inputOption === 'openKeyboard') {
      return;
    } else if (data.startsWith('action=set')) {
      await handleUserPeriodPostback(event);
      return;
    } else if (data.startsWith('action=confirmPlace') || data.startsWith('action=cancelPlace')) {
      const params = parsePostbackData(data);
      const action = params.action;
      const pendingId = params.pendingId;
      if (action && pendingId) {
        await handlePlaceConfirmPostback(event, action, pendingId);
      }
      return;
    }
  } catch (error) {
    await sendReplyMessage(event.replyToken, 'ポストバックイベントの処理中にエラーが発生しました。');
  }
};
