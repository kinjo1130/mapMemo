import { getPlaceDetails, PlaceDetails } from '@/lib/googleMaps';
import { saveMapLink } from '@/lib/saveMapLink';
import { getCurrentUser } from './User/getCurrentUser';
import { getJoinGroupInfo } from './Group/getJoinGroupInfo';
import { SaveMapLinkParams } from '@/types/Link';
import { Profile } from '@line/bot-sdk';
import { Group } from '@/types/Group';

type SaveGoogleMapsLinkParams = {
  mapUrl: string;
  userId: string;
  groupId?: string;
  userProfile?: Profile | null;
  groupData?: Group | null;
};

type SaveGoogleMapsLinkResult = {
  success: boolean;
  placeDetails?: PlaceDetails;
  error?: string;
};

export async function saveGoogleMapsLink(
  params: SaveGoogleMapsLinkParams
): Promise<SaveGoogleMapsLinkResult> {
  const { mapUrl, userId, groupId, userProfile, groupData } = params;

  if (!mapUrl || typeof mapUrl !== 'string') {
    return { success: false, error: 'Map URL is required and must be a string' };
  }

  if (!userId || typeof userId !== 'string') {
    return { success: false, error: 'User ID is required and must be a string' };
  }

  try {
    const placeDetails: PlaceDetails = await getPlaceDetails(mapUrl);
    console.log(`Place details: ${JSON.stringify(placeDetails)}`);

    // 引数で渡されていない場合のみFirestoreから取得（フォールバック）
    const currentUser = userProfile ?? await getCurrentUser(userId);

    let groupInfo = groupData ?? null;
    if (!groupInfo && groupId) {
      groupInfo = await getJoinGroupInfo(groupId, userId);
    }

    const saveMapLinkParams: SaveMapLinkParams = {
      userId,
      groupId: groupId || '',
      link: mapUrl,
      placeDetails,
      displayName: currentUser?.displayName || '',
      userPictureUrl: currentUser?.pictureUrl || '',
      groupName: groupInfo?.groupName || '',
      members: groupInfo?.members || [],
      groupPictureUrl: groupInfo?.pictureUrl || ''
    };

    await saveMapLink(saveMapLinkParams);

    return { success: true, placeDetails };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
