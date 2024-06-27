import { PostbackEvent } from '@line/bot-sdk';
import { sendReplyMessage } from './sendReplyMessage';
import { saveUserPeriod, UserPeriod } from './saveUserPeriod';
import { getUserPeriodFromDB } from './getUserPeriodFromDB';

export const handleUserPeriodPostback = async (event: PostbackEvent) => {
  const data = event.postback.data;
  const replyToken = event.replyToken;
  const userId = event.source.userId || '';  // 送信者のIDを使用

  // DBから既存の期間を取得
  const existingPeriod = await getUserPeriodFromDB(userId);

  let userPeriod: UserPeriod = {
    userId,
    startDate: existingPeriod?.startDate || null,
    endDate: existingPeriod?.endDate || null
  };

  // 型ガードを使用して params が DateTimePostbackのdate型であることを確認する
  if ('params' in event.postback && event.postback.params && 'date' in event.postback.params) {
    if (data === 'action=setStartDate') {
      userPeriod.startDate = event.postback.params.date;
    } else if (data === 'action=setEndDate') {
      userPeriod.endDate = event.postback.params.date;
    }
  }

  // 終了日だけが指定されている場合、開始日が必要であることを伝える
  if (userPeriod.endDate && !userPeriod.startDate && !existingPeriod?.startDate) {
    await saveUserPeriod(userPeriod);
    await sendReplyMessage(replyToken, `終了日が設定されました。\n終了日: ${userPeriod.endDate}\n開始日を設定してください。`);
    return;
  }

  // 開始日だけが指定されている場合、終了日が必要であることを伝える
  if (userPeriod.startDate && !userPeriod.endDate && !existingPeriod?.endDate) {
    await saveUserPeriod(userPeriod);
    await sendReplyMessage(replyToken, `開始日が設定されました。\n開始日: ${userPeriod.startDate}\n終了日を設定してください。`);
    return;
  }

  // 両方の期間が設定されている場合
  if (userPeriod.startDate && userPeriod.endDate) {
    if (new Date(userPeriod.startDate) > new Date(userPeriod.endDate)) {
      await sendReplyMessage(replyToken, '終了日は開始日の後でなければなりません。もう一度やり直してください。');
    } else {
      await saveUserPeriod(userPeriod);
      await sendReplyMessage(replyToken, `期間が正常に設定されました。\n開始日: ${userPeriod.startDate}\n終了日: ${userPeriod.endDate}`);
    }
  } else {
    // まだ設定されていない日付を伝える
    let message = '日付が設定されました。';

    if (!userPeriod.startDate && !existingPeriod?.startDate) {
      message += '\n開始日を設定してください。';
    } else if (userPeriod.startDate || existingPeriod?.startDate) {
      message += `\n開始日: ${userPeriod.startDate || existingPeriod?.startDate}`;
    }

    if (!userPeriod.endDate && !existingPeriod?.endDate) {
      message += '\n終了日を設定してください。';
    } else if (userPeriod.endDate || existingPeriod?.endDate) {
      message += `\n終了日: ${userPeriod.endDate || existingPeriod?.endDate}`;
    }

    await sendReplyMessage(replyToken, message);
  }
};
