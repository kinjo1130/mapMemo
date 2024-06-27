import { PostbackEvent } from '@line/bot-sdk';
import { sendReplyMessage } from './sendReplyMessage';
import { saveUserPeriod, UserPeriod } from './saveUserPeriod';
import { db } from './init/firebase';
import { doc, getDoc } from 'firebase/firestore';

const getUserPeriodFromDB = async (userId: string): Promise<UserPeriod | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    if (!userData || !userData.period) {
      return null;
    }

    const { startDate, endDate } = userData.period;

    // 期間データが存在するかチェック
    const period: UserPeriod = { userId };
    if (startDate) {
      period.startDate = startDate;
    }
    if (endDate) {
      period.endDate = endDate;
    }

    return period;
  } catch (error) {
    console.error('Error fetching user period from DB:', error);
    return null;
  }
};


export const handleUserPeriodPostback = async (event: PostbackEvent) => {
  const data = event.postback.data;
  const replyToken = event.replyToken;
  const userId = event.source.userId || '';  // 送信者のIDを使用

  // DBから既存の期間を取得
  const existingPeriod = await getUserPeriodFromDB(userId);

  let userPeriod: UserPeriod = {
    userId,
    startDate: existingPeriod?.startDate || undefined,
    endDate: existingPeriod?.endDate || undefined
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
      await sendReplyMessage(replyToken, `期間が正常に設定されました。\n開始日: ${userPeriod.startDate}\n終了日: ${userPeriod.endDate}`);
    }
  } else {
    await saveUserPeriod(userPeriod);
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
