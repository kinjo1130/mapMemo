import * as admin from 'firebase-admin';
import { client } from './init/line';
import { analyzeImageForPlace } from './analyzeImage';
import { searchPlaceByText, PlaceDetails } from './googleMaps';
import { saveMapLink } from './saveMapLink';
import { getCurrentUser } from './User/getCurrentUser';
import { getJoinGroupInfo } from './Group/getJoinGroupInfo';
import { saveImageBufferToStorage } from './Storage/GoogleMapPhotoUrl';
import { SaveMapLinkParams } from '@/types/Link';

const db = admin.firestore();

type SaveImageAsPlaceParams = {
  messageId: string;
  userId: string;
  groupId?: string;
};

type SaveImageAsPlaceResult = {
  success: boolean;
  placeName?: string;
  placeAddress?: string;
  mapsUrl?: string;
  pendingId?: string;
  imageSaved?: boolean;
  error?: string;
};

export async function saveImageAsPlace(
  params: SaveImageAsPlaceParams
): Promise<SaveImageAsPlaceResult> {
  const { messageId, userId, groupId } = params;

  try {
    // 1. LINEから画像を取得
    const stream = await client.getMessageContent(messageId);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const imageBuffer = Buffer.concat(chunks);

    // 2. 元画像をFirebase Storageに保存
    const originalImageUrl = await saveImageBufferToStorage(userId, messageId, imageBuffer);
    console.log('Original image saved to Storage:', originalImageUrl);

    // 3. GPT-4o Visionで画像を解析
    const analysis = await analyzeImageForPlace(imageBuffer);
    console.log('Image analysis result:', analysis);

    // 4. ユーザー・グループ情報を取得
    const currentUser = await getCurrentUser(userId);
    let groupData = null;
    if (groupId) {
      groupData = await getJoinGroupInfo(groupId, userId);
    }

    if (!analysis.placeName) {
      // 店舗特定できなかった場合は画像付きLinkを即保存（確認不要）
      const saveParams: SaveMapLinkParams = {
        userId,
        groupId: groupId || '',
        link: '',
        placeDetails: {
          name: analysis.category || '画像メモ',
          address: analysis.area || '',
          photoUrl: null,
          latitude: null,
          longitude: null,
        },
        originalImageUrl,
        displayName: currentUser?.displayName || '',
        userPictureUrl: currentUser?.pictureUrl || '',
        groupName: groupData?.groupName || '',
        members: groupData?.members || [],
        groupPictureUrl: groupData?.pictureUrl || '',
      };
      await saveMapLink(saveParams);
      return { success: false, error: 'place_not_identified', imageSaved: true };
    }

    // 5. 検索クエリを構築
    const queryParts = [analysis.placeName];
    if (analysis.area) queryParts.push(analysis.area);
    if (analysis.address) queryParts.push(analysis.address);
    const searchQuery = queryParts.join(' ');
    console.log('Searching Google Places with query:', searchQuery);

    // 6. Google Places APIで検索
    const placeDetails: PlaceDetails = await searchPlaceByText(searchQuery);
    console.log('Place details found:', placeDetails);

    // 7. Google Maps URLを生成
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      placeDetails.name + ' ' + placeDetails.address
    )}`;

    // 8. pendingPlacesに一時保存（確認待ち）
    const pendingData = {
      userId,
      groupId: groupId || '',
      link: mapsUrl,
      placeDetails: {
        name: placeDetails.name,
        address: placeDetails.address,
        photoUrl: placeDetails.photoUrl,
        latitude: placeDetails.latitude,
        longitude: placeDetails.longitude,
      },
      originalImageUrl,
      displayName: currentUser?.displayName || '',
      userPictureUrl: currentUser?.pictureUrl || '',
      groupName: groupData?.groupName || '',
      members: groupData?.members || [],
      groupPictureUrl: groupData?.pictureUrl || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('pendingPlaces').add(pendingData);
    console.log('Pending place saved with ID:', docRef.id);

    return {
      success: true,
      placeName: placeDetails.name,
      placeAddress: placeDetails.address,
      mapsUrl,
      pendingId: docRef.id,
      imageSaved: true,
    };
  } catch (error) {
    console.error('Error in saveImageAsPlace:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
