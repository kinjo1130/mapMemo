export interface PlaceInfo {
  name?: string;
  query?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

async function followRedirect(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow'
    });
    return response.url;
  } catch (error) {
    console.error('Error following redirect:', error);
    return url;
  }
}

export async function expandShortUrl(url: string): Promise<string> {
  let expanded = url;

  // 短縮URLを展開
  if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
    expanded = await followRedirect(url);
    console.log(`Expanded short URL: ${expanded}`);
  }

  // ftidパラメータのみのURLをCID URL経由でさらに展開
  const ftid = new URL(expanded).searchParams.get('ftid');
  if (ftid && !extractPlaceInfoSync(expanded)) {
    const cidUrl = ftidToCidUrl(ftid);
    if (cidUrl) {
      console.log(`Resolved ftid to CID URL: ${cidUrl}`);
      const resolved = await followRedirect(cidUrl);
      console.log(`Resolved CID URL: ${resolved}`);
      if (extractPlaceInfoSync(resolved)) {
        return resolved;
      }
    }
  }

  return expanded;
}

/**
 * ftid (例: "0x353f1c01efa772a9:0x74ecdda135ec596a") をCID URLに変換する。
 * ftidの ":" の後ろの16進数がCID。
 */
function ftidToCidUrl(ftid: string): string | null {
  const parts = ftid.split(':');
  if (parts.length !== 2) return null;
  try {
    const cid = BigInt(parts[1]).toString();
    return `https://www.google.com/maps?cid=${cid}`;
  } catch {
    return null;
  }
}

/** 同期版のextractPlaceInfo（expandShortUrl内部で使用） */
function extractPlaceInfoSync(url: string): PlaceInfo | null {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/');

    let name: string | undefined;
    let query: string | undefined;
    let coordinates: { lat: number; lng: number } | undefined;

    query = parsedUrl.searchParams.get('q') || undefined;
    if (query) {
      query = decodeURIComponent(query);
    }

    if (pathParts.includes('place')) {
      const placeIndex = pathParts.indexOf('place');
      if (placeIndex + 1 < pathParts.length) {
        name = decodeURIComponent(pathParts[placeIndex + 1]);
      }
    }

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

export function extractPlaceInfo(url: string): PlaceInfo | null {
  return extractPlaceInfoSync(url);
}