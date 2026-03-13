import { extractPlaceInfo, PlaceInfo, expandShortUrl } from './expandUrl';
import { fetchAndSaveToFirestore } from './Storage/GoogleMapPhotoUrl';

export interface PlaceDetails {
  name: string;
  address: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
}

export async function getPlaceDetails(mapUrl: string): Promise<PlaceDetails> {
  console.log(`Processing URL: ${mapUrl}`);
  const expandedUrl = await expandShortUrl(mapUrl);
  console.log(`Expanded URL: ${expandedUrl}`);
  const placeInfo = extractPlaceInfo(expandedUrl);
  console.log(`Extracted place info: ${JSON.stringify(placeInfo)}`);

  if (!placeInfo) {
    throw new Error('Invalid Google Maps URL');
  }

  return await searchAndFetchPlaceDetails(placeInfo);
}

async function searchAndFetchPlaceDetails(placeInfo: PlaceInfo): Promise<PlaceDetails> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is not set');
  }

  // First, search for the place
  const searchUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
  const searchParams = new URLSearchParams({
    input: placeInfo.query || placeInfo.name || `${placeInfo.coordinates?.lat},${placeInfo.coordinates?.lng}`,
    inputtype: 'textquery',
    fields: 'place_id',
    key: apiKey,
    language: 'ja',  // 日本語の結果を要求
  });

  const searchResponse = await fetch(`${searchUrl}?${searchParams}`);
  const searchData = await searchResponse.json();

  if (!searchResponse.ok || searchData.status !== 'OK') {
    console.error('Google Maps API search error:', searchData);
    throw new Error(`Google Maps API search error: ${searchData.error_message || 'Unknown error'}`);
  }

  if (searchData.candidates.length === 0) {
    throw new Error('Place not found');
  }

  const placeId = searchData.candidates[0].place_id;

  // Now fetch the place details
  const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
  const detailsParams = new URLSearchParams({
    place_id: placeId,
    fields: 'name,formatted_address,rating,photo,geometry',  // Added 'geometry' field
    key: apiKey,
    language: 'ja',  // 日本語の結果を要求
  });

  const detailsResponse = await fetch(`${detailsUrl}?${detailsParams}`);
  const detailsData = await detailsResponse.json();

  if (!detailsResponse.ok || detailsData.status !== 'OK') {
    console.error('Google Maps API details error:', detailsData);
    throw new Error(`Google Maps API details error: ${detailsData.error_message || 'Unknown error'}`);
  }

  const result = detailsData.result;
    console.log('Place details:', result);

    // 画像の処理
    let photoUrl: string | null = null;
    if (result.photos && result.photos.length > 0) {
      try {
        photoUrl = await fetchAndSaveToFirestore(
          placeId,
          result.photos[0].photo_reference,
          apiKey
        );
      } catch (error) {
        console.error('Failed to process image:', error);
        // 画像の処理に失敗しても、他の情報は返す
      }
    }

  return {
    name: result.name || '',
    address: result.formatted_address || '',
    photoUrl: photoUrl,
    latitude: result.geometry.location.lat || placeInfo.coordinates?.lat || 0,
    longitude: result.geometry.location.lng || placeInfo.coordinates?.lng || 0,
  };
}