import { PostbackEvent } from '@line/bot-sdk';
import { sendReplyMessage } from './sendReplyMessage';
import { saveUserPeriod, UserPeriod } from './saveUserPeriod';

export const handleUserPeriodPostback = async (event: PostbackEvent) => {
  const data = event.postback.data;
  const replyToken = event.replyToken;
  const userId = event.source.userId || '';  // 送信者のIDを使用

  let userPeriod: UserPeriod = {
    userId
  };

  // 型ガードを使用して params が DateTimePostbackのdate型であることを確認する
  if ('params' in event.postback && event.postback.params && 'date' in event.postback.params) {
    if (data === 'action=setStartDate') {
      userPeriod.startDate = event.postback.params.date;
    } else if (data === 'action=setEndDate') {
      userPeriod.endDate = event.postback.params.date;
    }
  }

  if (userPeriod.startDate && userPeriod.endDate) {
    if (new Date(userPeriod.startDate) > new Date(userPeriod.endDate)) {
      await sendReplyMessage(replyToken, '終了日は開始日の後でなければなりません。もう一度やり直してください。');
    } else {
      await saveUserPeriod(userPeriod);
      await sendReplyMessage(replyToken, '期間が正常に設定されました。');
    }
  } else {
    await saveUserPeriod(userPeriod);
    await sendReplyMessage(replyToken, '日付が設定されました。期間設定を完了してください。');
  }
};
