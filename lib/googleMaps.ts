import { extractPlaceInfo, PlaceInfo, expandShortUrl } from './expandUrl';
import { fetchAndSaveToFirestore } from './Storage/GoogleMapPhotoUrl';

export interface PlaceDetails {
  name: string;
  address: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  categories: string[];
  placeId: string;
  rating: number | null;
  userRatingsTotal: number | null;
  priceLevel: number | null;
  openingHours: string[] | null;
  website: string | null;
  phoneNumber: string | null;
  googleMapsUrl: string | null;
  businessStatus: string | null;
  editorialSummary: string | null;
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

async function findPlaceId(placeInfo: PlaceInfo, apiKey: string): Promise<string> {
  const hasTextInput = placeInfo.query || placeInfo.name;

  if (hasTextInput) {
    // テキスト入力がある場合はFind Place From Textを使用
    const searchUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
    const searchParams = new URLSearchParams({
      input: placeInfo.query || placeInfo.name || '',
      inputtype: 'textquery',
      fields: 'place_id',
      key: apiKey,
      language: 'ja',
    });
    if (placeInfo.coordinates) {
      searchParams.set('locationbias', `point:${placeInfo.coordinates.lat},${placeInfo.coordinates.lng}`);
    }

    const searchResponse = await fetch(`${searchUrl}?${searchParams}`);
    const searchData = await searchResponse.json();

    if (!searchResponse.ok || searchData.status !== 'OK') {
      console.error('Google Maps API search error:', searchData);
      throw new Error(`Google Maps API search error: ${searchData.error_message || 'Unknown error'}`);
    }
    if (searchData.candidates.length === 0) {
      throw new Error('Place not found');
    }
    return searchData.candidates[0].place_id;
  }

  if (placeInfo.coordinates) {
    // 座標のみの場合はNearby Searchで最寄りの場所を取得
    const nearbyUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const nearbyParams = new URLSearchParams({
      location: `${placeInfo.coordinates.lat},${placeInfo.coordinates.lng}`,
      rankby: 'distance',
      key: apiKey,
      language: 'ja',
    });

    const nearbyResponse = await fetch(`${nearbyUrl}?${nearbyParams}`);
    const nearbyData = await nearbyResponse.json();

    if (!nearbyResponse.ok || nearbyData.status !== 'OK') {
      console.error('Google Maps API nearby search error:', nearbyData);
      throw new Error(`Google Maps API nearby search error: ${nearbyData.error_message || 'Unknown error'}`);
    }
    if (nearbyData.results.length === 0) {
      throw new Error('Place not found');
    }
    return nearbyData.results[0].place_id;
  }

  throw new Error('No search input or coordinates available');
}

async function searchAndFetchPlaceDetails(placeInfo: PlaceInfo): Promise<PlaceDetails> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is not set');
  }

  const placeId = await findPlaceId(placeInfo, apiKey);

  // Now fetch the place details
  const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
  const detailsParams = new URLSearchParams({
    place_id: placeId,
    fields: 'place_id,name,formatted_address,rating,user_ratings_total,price_level,opening_hours,website,formatted_phone_number,url,business_status,editorial_summary,photo,geometry,type',
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
    categories: result.types || [],
    placeId: placeId,
    rating: result.rating ?? null,
    userRatingsTotal: result.user_ratings_total ?? null,
    priceLevel: result.price_level ?? null,
    openingHours: result.opening_hours?.weekday_text ?? null,
    website: result.website ?? null,
    phoneNumber: result.formatted_phone_number ?? null,
    googleMapsUrl: result.url ?? null,
    businessStatus: result.business_status ?? null,
    editorialSummary: result.editorial_summary?.overview ?? null,
  };
}