import { getPlaceDetails, PlaceDetails } from '@/lib/googleMaps';
import { saveMapLink } from '@/lib/saveMapLink';
import { getCurrentUser } from './User/getCurrentUser';
import { getJoinGroupInfo } from './Group/getJoinGroupInfo';
import { SaveMapLinkParams } from '@/types/Link';

type SaveGoogleMapsLinkParams = {
  mapUrl: string;
  userId: string;
  groupId?: string;
};

type SaveGoogleMapsLinkResult = {
  success: boolean;
  placeDetails?: PlaceDetails;
  error?: string;
};

export async function saveGoogleMapsLink(
  params: SaveGoogleMapsLinkParams
): Promise<SaveGoogleMapsLinkResult> {
  const { mapUrl, userId, groupId } = params;

  if (!mapUrl || typeof mapUrl !== 'string') {
    return { success: false, error: 'Map URL is required and must be a string' };
  }

  if (!userId || typeof userId !== 'string') {
    return { success: false, error: 'User ID is required and must be a string' };
  }

  try {
    const placeDetails: PlaceDetails = await getPlaceDetails(mapUrl);
    console.log(`Place details: ${JSON.stringify(placeDetails)}`);

    const currentUser = await getCurrentUser(userId);

    let groupData = null;
    if (groupId) {
      groupData = await getJoinGroupInfo(groupId, userId);
    }

    const saveMapLinkParams: SaveMapLinkParams = {
      userId,
      groupId: groupId || '',
      link: mapUrl,
      placeDetails,
      displayName: currentUser?.displayName || '',
      userPictureUrl: currentUser?.pictureUrl || '',
      groupName: groupData?.groupName || '',
      members: groupData?.members || [],
      groupPictureUrl: groupData?.pictureUrl || ''
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
