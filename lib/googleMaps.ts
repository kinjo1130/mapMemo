import { Client, PlaceInputType } from "@googlemaps/google-maps-services-js"
import { expandShortUrl, extractPlaceInfo, PlaceInfo } from './expandUrl'

const client = new Client({})

export interface PlaceDetails {
  name: string
  address: string
  rating: number | null
  photoUrl: string | null
  openingHours: string[] | null
}

export async function getPlaceDetails(mapUrl: string): Promise<PlaceDetails> {
  const expandedUrl = await expandShortUrl(mapUrl)
  console.log(`Expanded URL: ${expandedUrl}`)
  const placeInfo = extractPlaceInfo(expandedUrl)
  console.log(`Place info: ${JSON.stringify(placeInfo)}`)

  if (!placeInfo) {
    throw new Error('Invalid Google Maps URL')
  }

  const placeId = await getPlaceId(placeInfo)
  return await fetchPlaceDetails(placeId)
}

async function getPlaceId(placeInfo: PlaceInfo): Promise<string> {
  if (placeInfo.placeId && placeInfo.placeId.startsWith('ChIJ')) {
    // 既に正しい形式のPlace IDを持っている場合はそのまま返す
    return placeInfo.placeId;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is not set');
  }

  let url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
  let params: URLSearchParams;

  if (placeInfo.coordinates) {
    params = new URLSearchParams({
      input: `${placeInfo.coordinates.lat},${placeInfo.coordinates.lng}`,
      inputtype: 'textquery',
      fields: 'place_id',
      key: apiKey,
    });
  } else if (placeInfo.query) {
    params = new URLSearchParams({
      input: placeInfo.query,
      inputtype: 'textquery',
      fields: 'place_id',
      key: apiKey,
    });
  } else if (placeInfo.placeId) {
    // URLから抽出した識別子を使用して検索
    params = new URLSearchParams({
      input: placeInfo.placeId,
      inputtype: 'textquery',
      fields: 'place_id',
      key: apiKey,
    });
  } else {
    throw new Error('Invalid place info');
  }

  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  if (!response.ok) {
    console.error('Google Maps API error response:', data);
    throw new Error(`Google Maps API error: ${data.error_message || 'Unknown error'}`);
  }
  console.log('Place ID search result:', data);

  if (data.candidates.length === 0) {
    throw new Error('Place not found');
  }

  return data.candidates[0].place_id;
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is not set');
  }

  const url = 'https://maps.googleapis.com/maps/api/place/details/json';
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'name,formatted_address,rating,photo,opening_hours',
    key: apiKey,
  });

  console.log(`Fetching place details for place ID: ${placeId}`);

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Maps API error response:', data);
      throw new Error(`Google Maps API error: ${data.error_message || 'Unknown error'}`);
    }

    if (!data.result) {
      console.error('No result in Google Maps API response:', data);
      throw new Error('No result found in Google Maps API response');
    }

    const result = data.result;

    let photoUrl: string | null = null;
    if (result.photos && result.photos.length > 0) {
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${apiKey}`;
    }

    return {
      name: result.name || '',
      address: result.formatted_address || '',
      rating: result.rating || null,
      photoUrl: photoUrl,
      openingHours: result.opening_hours ? result.opening_hours.weekday_text : null,
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
}