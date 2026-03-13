export interface PlaceInfo {
  name?: string;
  query?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  ftid?: string;
}

export async function expandShortUrl(url: string): Promise<string> {
  if (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
    return url;
  }
  try {
    // GETリクエスト + User-Agentでブラウザと同じリダイレクトチェーンを取得
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MapMemoBot/1.0)',
      },
    });
    return response.url;
  } catch (error) {
    console.error('Error expanding URL:', error);
    return url;
  }
}

export function extractPlaceInfo(url: string): PlaceInfo | null {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/');

    let name: string | undefined;
    let query: string | undefined;
    let coordinates: { lat: number; lng: number } | undefined;

    // Extract query from q parameter
    query = parsedUrl.searchParams.get('q') || undefined;
    if (query) {
      query = decodeURIComponent(query);
    }

    // Extract name from path
    if (pathParts.includes('place')) {
      const placeIndex = pathParts.indexOf('place');
      if (placeIndex + 1 < pathParts.length) {
        name = decodeURIComponent(pathParts[placeIndex + 1]);
      }
    }

    // Extract coordinates
    const coordinatesMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordinatesMatch) {
      coordinates = {
        lat: parseFloat(coordinatesMatch[1]),
        lng: parseFloat(coordinatesMatch[2])
      };
    }

    if (name || query || coordinates) {
      return { name, query, coordinates };
    }

    // ftidパラメータからplace情報を抽出（短縮URLがftid形式にリダイレクトされた場合）
    const ftid = parsedUrl.searchParams.get('ftid');
    if (ftid) {
      return { ftid };
    }

    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}