export async function expandShortUrl(url: string): Promise<string> {
  if (!url.includes('goo.gl') && !url.includes('maps.app')) {
    return url;
  }
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual'
    });

    if (response.status >= 300 && response.status < 400) {
      return response.headers.get('Location') || url;
    }

    return url;
  } catch (error) {
    console.error('Error expanding URL:', error);
    return url;
  }
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlaceInfo {
  placeId?: string;
  coordinates?: Coordinates;
  query?: string;
}

export function extractPlaceInfo(url: string): PlaceInfo | null {
  // Place ID extraction
  const placeIdRegex = /!1s(0x[a-f0-9]+:0x[a-f0-9]+)/;
  const placeIdMatch = url.match(placeIdRegex);
  if (placeIdMatch) {
    return { placeId: placeIdMatch[1] };
  }

  // Coordinates extraction
  const coordinatesRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const coordinatesMatch = url.match(coordinatesRegex);
  if (coordinatesMatch) {
    return {
      coordinates: {
        lat: parseFloat(coordinatesMatch[1]),
        lng: parseFloat(coordinatesMatch[2])
      }
    };
  }

  // Query extraction
  const queryRegex = /[?&]q=([^&]+)/;
  const queryMatch = url.match(queryRegex);
  if (queryMatch) {
    const query = decodeURIComponent(queryMatch[1].replace(/\+/g, ' '));
    return { query };
  }

  // FTID (Feature ID) extraction
  const ftidRegex = /ftid=([^&]+)/;
  const ftidMatch = url.match(ftidRegex);
  if (ftidMatch) {
    return { placeId: ftidMatch[1] };
  }

  return null;
}