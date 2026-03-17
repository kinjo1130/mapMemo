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
    // まず redirect: 'manual' でリダイレクト先URLをLocationヘッダーから取得
    // redirect: 'follow' だとコンセント画面等に辿り着き、正しいURLが取れない場合がある
    const expandedUrl = await followRedirectsManually(url);
    console.log(`Expanded URL (manual redirect): ${expandedUrl}`);

    // ftid URLの場合、HTMLから座標と場所名を抽出してplace URL形式に変換
    if (expandedUrl.includes('ftid=')) {
      const response = await fetch(expandedUrl);
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

async function followRedirectsManually(url: string, maxRedirects: number = 10): Promise<string> {
  let currentUrl = url;
  for (let i = 0; i < maxRedirects; i++) {
    const response = await fetch(currentUrl, { redirect: 'manual' });
    const status = response.status;

    if (status >= 300 && status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return currentUrl;
      }
      // 相対URLの場合、絶対URLに変換
      currentUrl = new URL(location, currentUrl).toString();

      // Google Maps URLに到達したらそこで停止（コンセント画面等を避ける）
      if (currentUrl.includes('google.com/maps') || currentUrl.includes('maps.google.com')) {
        return currentUrl;
      }
      continue;
    }

    // リダイレクトでない場合は現在のURLを返す
    return currentUrl;
  }
  return currentUrl;
}

export function extractCoordsFromHtml(html: string): { lat: string; lng: string } | null {
  // パターン1: static map URLの center=LAT%2CLNG
  const centerMatch = html.match(/center=(-?[\d.]+)%2C(-?[\d.]+)/);
  if (centerMatch) {
    return { lat: centerMatch[1], lng: centerMatch[2] };
  }

  // パターン2: @LAT,LNG in URLs within the HTML
  const atMatch = html.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: atMatch[1], lng: atMatch[2] };
  }

  // パターン3: ll=LAT,LNG パラメータ
  const llMatch = html.match(/ll=(-?[\d.]+),(-?[\d.]+)/);
  if (llMatch) {
    return { lat: llMatch[1], lng: llMatch[2] };
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