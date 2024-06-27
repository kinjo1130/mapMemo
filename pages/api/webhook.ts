import { NextApiRequest, NextApiResponse } from 'next';
import { client } from '../../lib/init/line';
import { saveUserProfile } from '../../lib/saveUserProfile';
import { Profile } from '@line/bot-sdk';
import { saveMapLink } from '../../lib/saveMapLink';
import { sendReplyMessage } from '../../lib/sendReplyMessage';
import { handleUserPeriodPostback } from '@/lib/handleUserPeriodPostback';
import { isWithinUserPeriod } from '@/lib/checkUserPeriod';
import { sendPeriodSettingMessage } from '@/lib/sendPeriodSettingMessage';

const isGoogleMapsUrl = (url: string) => {
  return url.startsWith('https://maps.google.com/') ||
    url.startsWith('https://www.google.com/maps') ||
    url.startsWith('https://maps.app.goo.gl/') ||
    url.startsWith('https://goo.gl/maps');
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const events = req.body.events;
    console.log(`Received ${events.length} events`);

    for (const event of events) {
      console.log(`Processing event: ${JSON.stringify(event)}`);

      if (event.type === 'follow') {
        const { userId } = event.source;
        console.log(`New follower: ${userId}`);

        // ユーザー情報を取得してFirestoreに保存
        try {
          const profile = await client.getProfile(userId) as Profile;
          await saveUserProfile(profile);
        } catch (error) {
          console.error('Error getting profile or saving user:', error);
        }
      }

      // 他のイベント処理（例：messageイベント）
      if (event.type === 'message' && event.message.type === 'text') {
        const { userId, groupId } = event.source;
        const replyToken = event.replyToken;
        const messageText = event.message.text;
        const timestamp = new Date(event.timestamp);

        console.log(`ReplyToken: ${replyToken}`);
        console.log(`Message: ${messageText}`);

        // 期間設定変更のチェック
        if (messageText === '保存期間変更') {
          await sendPeriodSettingMessage(replyToken);
          continue;
        }

        // 期間内かどうかのチェック
        const withinPeriod = await isWithinUserPeriod(userId, timestamp);
        if (!withinPeriod) {
          await sendReplyMessage(replyToken, 'この期間にはメッセージを保存できません。');
          continue;
        }

        // Google Mapsのリンクの場合は保存
        if (isGoogleMapsUrl(messageText)) {
          try {
            await saveMapLink({ userId, groupId, link: messageText });
            await sendReplyMessage(replyToken, 'Google Mapsのリンクを保存しました。');
          } catch (error) {
            console.error('Error saving link:', error);
            res.status(500).send('Error saving link');
            return;
          }
        } else {
          console.log(`Received non-Google Maps URL: ${messageText}`);
        }
      }

      if (event.type === 'postback') {
        try {
          await handleUserPeriodPostback(event);
        } catch (error) {
          await sendReplyMessage(event.replyToken, 'ポストバックイベントの処理中にエラーが発生しました。');
        }
      }
    }

    res.status(200).send('OK');
  } else {
    res.status(405).send('Method not allowed');
  }
};

export default handler;
