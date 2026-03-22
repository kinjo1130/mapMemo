import { client } from './init/line';
import { analyzeImageForPlace } from './analyzeImage';
import { searchPlaceByText, PlaceDetails } from './googleMaps';
import { saveMapLink } from './saveMapLink';
import { getCurrentUser } from './User/getCurrentUser';
import { getJoinGroupInfo } from './Group/getJoinGroupInfo';
import { SaveMapLinkParams } from '@/types/Link';

type SaveImageAsPlaceParams = {
  messageId: string;
  userId: string;
  groupId?: string;
};

type SaveImageAsPlaceResult = {
  success: boolean;
  placeName?: string;
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

    // 2. GPT-4o Visionで画像を解析
    const analysis = await analyzeImageForPlace(imageBuffer);
    console.log('Image analysis result:', analysis);

    if (!analysis.placeName) {
      return { success: false, error: 'place_not_identified' };
    }

    // 3. 検索クエリを構築
    const queryParts = [analysis.placeName];
    if (analysis.area) queryParts.push(analysis.area);
    if (analysis.address) queryParts.push(analysis.address);
    const searchQuery = queryParts.join(' ');
    console.log('Searching Google Places with query:', searchQuery);

    // 4. Google Places APIで検索
    const placeDetails: PlaceDetails = await searchPlaceByText(searchQuery);
    console.log('Place details found:', placeDetails);

    // 5. Google Maps URLを生成
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      placeDetails.name + ' ' + placeDetails.address
    )}`;

    // 6. ユーザー・グループ情報を取得
    const currentUser = await getCurrentUser(userId);

    let groupData = null;
    if (groupId) {
      groupData = await getJoinGroupInfo(groupId, userId);
    }

    // 7. Firestoreに保存
    const saveMapLinkParams: SaveMapLinkParams = {
      userId,
      groupId: groupId || '',
      link: mapsUrl,
      placeDetails,
      displayName: currentUser?.displayName || '',
      userPictureUrl: currentUser?.pictureUrl || '',
      groupName: groupData?.groupName || '',
      members: groupData?.members || [],
      groupPictureUrl: groupData?.pictureUrl || '',
    };

    await saveMapLink(saveMapLinkParams);

    return { success: true, placeName: placeDetails.name };
  } catch (error) {
    console.error('Error in saveImageAsPlace:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
