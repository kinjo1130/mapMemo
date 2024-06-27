import { PostbackEvent } from '@line/bot-sdk';
import { sendReplyMessage } from './sendReplyMessage';
import { handleUserPeriodPostback } from './handleUserPeriodPostback';

// 型ガードを使用して inputOption プロパティが存在するか確認する
const hasInputOption = (postback: any): postback is { inputOption: string } => {
  return 'inputOption' in postback;
};

export const handlePostbackEvent = async (event: PostbackEvent) => {
  const data = event.postback.data;

  try {
    if (hasInputOption(event.postback) && event.postback.inputOption === 'openKeyboard') {
      return;
    } else if (data.startsWith('action=set')) {
      await handleUserPeriodPostback(event);
      return;
    } else {
      await sendReplyMessage(event.replyToken, '未知のポストバックアクションです。');
      return;
    }
  } catch (error) {
    await sendReplyMessage(event.replyToken, 'ポストバックイベントの処理中にエラーが発生しました。');
  }
};
