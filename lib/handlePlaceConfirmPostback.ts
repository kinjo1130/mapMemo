import * as admin from 'firebase-admin';
import { PostbackEvent } from '@line/bot-sdk';
import { saveMapLink } from './saveMapLink';
import { sendReplyMessage } from './sendReplyMessage';

const db = admin.firestore();

export const handlePlaceConfirmPostback = async (
  event: PostbackEvent,
  action: string,
  pendingId: string
) => {
  const replyToken = event.replyToken;

  try {
    const docRef = db.collection('pendingPlaces').doc(pendingId);
    const doc = await docRef.get();

    if (!doc.exists) {
      await sendReplyMessage(replyToken, 'この確認は期限切れです。もう一度画像を送信してください。');
      return;
    }

    const data = doc.data()!;

    if (action === 'confirmPlace') {
      await saveMapLink({
        userId: data.userId,
        groupId: data.groupId,
        link: data.link,
        placeDetails: data.placeDetails,
        originalImageUrl: data.originalImageUrl,
        displayName: data.displayName,
        userPictureUrl: data.userPictureUrl,
        groupName: data.groupName,
        members: data.members,
        groupPictureUrl: data.groupPictureUrl,
      });

      await docRef.delete();
      await sendReplyMessage(replyToken, `「${data.placeDetails.name}」を保存しました！`);
    } else if (action === 'cancelPlace') {
      await docRef.delete();
      await sendReplyMessage(replyToken, '保存をキャンセルしました。');
    }
  } catch (error) {
    console.error('Error in handlePlaceConfirmPostback:', error);
    await sendReplyMessage(replyToken, '処理中にエラーが発生しました。');
  }
};
