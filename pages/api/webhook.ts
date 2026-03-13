import { NextApiRequest, NextApiResponse } from 'next';
import { client } from '../../lib/init/line';
import { saveUserProfile } from '../../lib/User/saveUserProfile';
import { Profile } from '@line/bot-sdk';
import { sendReplyMessage } from '../../lib/sendReplyMessage';
import { sendPeriodSettingMessage } from '@/lib/sendPeriodSettingMessage';
import { handlePostbackEvent } from '@/lib/handlePostbackEvent';
import { saveGoogleMapsLink } from '@/lib/saveGoogleMapsLink';
import { checkUserExists } from '@/lib/User/checkUserExists';
import { getOrFetchGroupInfo } from '@/lib/groupUtils';
import { joinGroup } from '@/lib/Group/joinGroup';
import { IsJoinGroup } from '@/lib/Group/IsJoinGroup';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/init/firebase';

const isGoogleMapsUrl = (text: string) => {
  // URLを抽出するための正規表現
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  
  if (!urls) return false;
  
  // 抽出したURLのいずれかがGoogle MapsのURLであるかをチェック
  return urls.some(url => 
    url.includes('maps.google.com/') ||
    url.includes('google.com/maps') ||
    url.includes('maps.app.goo.gl/') ||
    url.includes('goo.gl/maps')
  );
};

const trimGoogleMapLink = (text: string): string | null => {
  // URLを抽出するための正規表現
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  
  if (!urls) return null;
  
  // Google Maps URLを検索
  const googleMapsUrl = urls.find(url => 
    url.includes('maps.google.com/') ||
    url.includes('google.com/maps') ||
    url.includes('maps.app.goo.gl/') ||
    url.includes('goo.gl/maps')
  );
  
  return googleMapsUrl || null;
};


/** ユーザードキュメントのデータから期間内かどうかをチェック */
const isWithinPeriodFromData = (userData: Record<string, any> | undefined, timestamp: Date): boolean => {
  if (!userData || !userData.period) return true;
  const { startDate, endDate } = userData.period;
  if (!startDate && !endDate) return true;
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start && end) return timestamp >= start && timestamp <= end;
  if (start && !end) return timestamp >= start;
  if (!start && end) return timestamp <= end;
  return true;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const events = req.body.events;
    console.log(`Received ${events} `);
    console.log(`Received ${events.length} events`);

    // 即座に200を返却 — LINEは処理完了を待つ必要がない
    res.status(200).send('OK');

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

        // グループ情報取得とユーザードキュメント取得を並列化
        const [groupInfo, userDoc] = await Promise.all([
          groupId
            ? getOrFetchGroupInfo(groupId, userId).catch((error) => {
                console.error('Error getting or fetching group info:', error);
                return null;
              })
            : Promise.resolve(null),
          getDoc(doc(db, 'users', userId)),
        ]);

        if (groupInfo) {
          console.log(`Group info: ${JSON.stringify(groupInfo)}`);
        }

        // ユーザー存在チェック（取得済みのドキュメントで判定）
        if (!userDoc.exists()) {
          console.log(`User ${userId} is not registered`);
          return;
        }

        const userData = userDoc.data();

        // 期間設定変更のチェック
        if (messageText === '保存期間変更') {
          await sendPeriodSettingMessage(replyToken);
          continue;
        }

        // 期間内かどうかのチェック（取得済みのデータで判定）
        const withinPeriod = isWithinPeriodFromData(userData, timestamp);
        if (!withinPeriod) {
          await sendReplyMessage(replyToken, 'この期間にはメッセージを保存できません。');
          continue;
        }
        console.log({messageText})

        if (isGoogleMapsUrl(messageText)) {
          try {
            // ユーザープロフィールとグループ情報を引数で渡す
            const userProfile: Profile | null = userData ? {
              userId: userData.userId,
              displayName: userData.displayName,
              pictureUrl: userData.pictureUrl,
              statusMessage: userData.statusMessage,
            } : null;

            const result = await saveGoogleMapsLink({
              mapUrl: trimGoogleMapLink(messageText) || '',
              userId,
              groupId: groupId || '',
              userProfile,
              groupData: groupInfo ? {
                groupId: groupInfo.groupId,
                groupName: groupInfo.groupName,
                members: groupInfo.members,
                pictureUrl: groupInfo.pictureUrl,
              } : null,
            });
            console.log(`saveGoogleMapsLink result: ${JSON.stringify(result)}`);
            if (result.error) {
              await sendReplyMessage(replyToken, `エラーが発生しました: ${result.error}`);
            } else {
              await sendReplyMessage(replyToken, "Google Mapsのリンクを保存しました。");
            }
          } catch (error) {
            console.error('Error saving Google Maps link:', error);
            await sendReplyMessage(replyToken, 'リンクの保存中にエラーが発生しました。');
          }
        } else {
          console.log(`Received non-Google Maps URL: ${messageText}`);
          // メンションがきた時の処理
          // メンションチェック (@mapmemo が含まれているか)
          if (messageText.includes('@mapMemo')) {
            console.log("Mentioned @mapMemo");
            const replyToken = event.replyToken;
            await sendReplyMessage(replyToken, {
              type: 'flex',
              altText: '保存したマップを確認できます',
              contents: {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "MapMemo",
                      weight: "bold",
                      size: "xl",
                      color: "#1DB446"
                    },
                    {
                      type: "text",
                      text: "お気に入りの場所を保存・管理",
                      size: "sm",
                      color: "#999999",
                      margin: "md"
                    },
                    {
                      type: "separator",
                      margin: "xxl"
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      margin: "xxl",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "MapMemoへようこそ！",
                          size: "md",
                          weight: "bold"
                        },
                        {
                          type: "text",
                          text: "お気に入りの場所を簡単に保存して、いつでも確認できます。",
                          wrap: true,
                          size: "xs",
                          margin: "md",
                          color: "#666666"
                        }
                      ]
                    }
                  ]
                },
                footer: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      style: "primary",
                      height: "sm",
                      action: {
                        type: "uri",
                        label: "保存した地点一覧を見る",
                        uri: "https://liff.line.me/2005710452-e6m8Ao66"
                      },
                      color: "#1DB446"
                    },
                    {
                      type: "spacer",
                      size: "sm"
                    }
                  ],
                  flex: 0
                }
              }
            });
          }
        }
      }
      if (event.type === 'postback') {
        try {
          await handlePostbackEvent(event);
        } catch (error) {
          await sendReplyMessage(event.replyToken, 'ポストバックイベントの処理中にエラーが発生しました。');
        }
      }
      if(event.type === 'memberJoined') {
        const { groupId } = event.source;
        const  userIds  = event.joined.members as [
          {
            "type": string,
            "userId": string
          },
        ];
        try {
          userIds.forEach(async ({ userId }) => {
            // すでに参加している場合は何もしない
            if (await IsJoinGroup(groupId, userId)) {
              return;
            }

            // DBにユーザー情報がない場合は取得して保存
            if (!await checkUserExists(userId)) {
            const profile = await client.getProfile(userId);
            await saveUserProfile(profile);
          }
            // ここでGroupのmembersに参加しているユーザーのuidを追加する
            await joinGroup(groupId, userId);
          });
        } catch (error) {
          console.error('Error getting or fetching group info:', error);
        }
      }

    }

  } else {
    res.status(405).send('Method not allowed');
  }
};

export default handler;
