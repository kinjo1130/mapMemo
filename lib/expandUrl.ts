export interface PlaceInfo {
  name?: string;
  query?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export async function expandShortUrl(url: string): Promise<string> {
  if (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
    return url;
  }
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const expandedUrl = response.url;

    // ftid URLの場合、HTMLから座標と場所名を抽出してplace URL形式に変換
    if (expandedUrl.includes('ftid=')) {
      const html = await response.text();
      const coords = extractCoordsFromHtml(html);
      if (coords) {
        const placeName = extractPlaceNameFromHtml(html);
        if (placeName) {
          // 場所名がある場合は /place/Name/@lat,lng 形式にして正確な検索を可能にする
          return `https://www.google.com/maps/place/${encodeURIComponent(placeName)}/@${coords.lat},${coords.lng},17z`;
        }
        return `https://www.google.com/maps/@${coords.lat},${coords.lng},17z`;
      }
    }
    return expandedUrl;
  } catch (error) {
    console.error('Error expanding URL:', error);
    return url;
  }
}

export function extractCoordsFromHtml(html: string): { lat: string; lng: string } | null {
  // og:title内のstatic map URLから座標を取得
  // パターン: center=35.50924045%2C139.7698121
  const match = html.match(/center=(-?[\d.]+)%2C(-?[\d.]+)/);
  if (match) {
    return { lat: match[1], lng: match[2] };
  }
  return null;
}

export function extractPlaceNameFromHtml(html: string): string | null {
  // og:title メタタグから場所名を取得
  const match = html.match(/<meta\s+(?:property="og:title"\s+content="([^"]+)"|content="([^"]+)"\s+property="og:title")/);
  if (match) {
    const title = match[1] || match[2];
    // "· 場所名" や "場所名 - Google Maps" などのパターンを整理
    const cleaned = title.replace(/\s*[-·]\s*Google\s*Maps?\s*$/i, '').trim();
    if (cleaned && cleaned !== 'Google Maps') {
      return cleaned;
    }
  }
  return null;
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

    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}