import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expandShortUrl, extractCoordsFromHtml, extractPlaceInfo, extractPlaceNameFromHtml } from '../expandUrl';

// ---- extractCoordsFromHtml ----

describe('extractCoordsFromHtml', () => {
  it('og:title内のstatic map URLから座標を抽出できる', () => {
    const html = `
      <meta property="og:title" content="Some Place">
      <meta property="og:image" content="https://maps.google.com/maps/api/staticmap?center=35.50924045%2C139.7698121&zoom=16&size=256x256">
    `;
    expect(extractCoordsFromHtml(html)).toEqual({ lat: '35.50924045', lng: '139.7698121' });
  });

  it('負の座標を抽出できる', () => {
    const html = `center=-33.8688%2C151.2093`;
    expect(extractCoordsFromHtml(html)).toEqual({ lat: '-33.8688', lng: '151.2093' });
  });

  it('両方負の座標を抽出できる', () => {
    const html = `center=-33.8688%2C-70.1234`;
    expect(extractCoordsFromHtml(html)).toEqual({ lat: '-33.8688', lng: '-70.1234' });
  });

  it('座標が見つからない場合はnullを返す', () => {
    const html = `<html><body>No coordinates here</body></html>`;
    expect(extractCoordsFromHtml(html)).toBeNull();
  });

  it('空文字列の場合はnullを返す', () => {
    expect(extractCoordsFromHtml('')).toBeNull();
  });
});

// ---- extractPlaceNameFromHtml ----

describe('extractPlaceNameFromHtml', () => {
  it('og:title メタタグから場所名を抽出できる', () => {
    const html = `<meta property="og:title" content="Hidden Hollow">`;
    expect(extractPlaceNameFromHtml(html)).toBe('Hidden Hollow');
  });

  it('content が先に来るパターンでも抽出できる', () => {
    const html = `<meta content="Tokyo Tower" property="og:title">`;
    expect(extractPlaceNameFromHtml(html)).toBe('Tokyo Tower');
  });

  it('Google Maps サフィックスを除去する', () => {
    const html = `<meta property="og:title" content="東京タワー - Google Maps">`;
    expect(extractPlaceNameFromHtml(html)).toBe('東京タワー');
  });

  it('og:title が Google Maps のみの場合は null を返す', () => {
    const html = `<meta property="og:title" content="Google Maps">`;
    expect(extractPlaceNameFromHtml(html)).toBeNull();
  });

  it('og:title がない場合は null を返す', () => {
    const html = `<html><body>No title</body></html>`;
    expect(extractPlaceNameFromHtml(html)).toBeNull();
  });
});

// ---- extractPlaceInfo ----

describe('extractPlaceInfo', () => {
  it('place URLから名前と座標を抽出できる', () => {
    const url = 'https://www.google.com/maps/place/Tokyo+Tower/@35.6585805,139.7454329,17z';
    const result = extractPlaceInfo(url);
    expect(result).toEqual({
      name: 'Tokyo+Tower',
      query: undefined,
      coordinates: { lat: 35.6585805, lng: 139.7454329 },
    });
  });

  it('@lat,lng形式のURLから座標を抽出できる', () => {
    const url = 'https://www.google.com/maps/@35.50924045,139.7698121,17z';
    const result = extractPlaceInfo(url);
    expect(result).toEqual({
      name: undefined,
      query: undefined,
      coordinates: { lat: 35.50924045, lng: 139.7698121 },
    });
  });

  it('qパラメータからクエリを抽出できる', () => {
    const url = 'https://www.google.com/maps?q=Tokyo+Station';
    const result = extractPlaceInfo(url);
    expect(result).toEqual({
      name: undefined,
      query: 'Tokyo Station',
      coordinates: undefined,
    });
  });

  it('ftidのみのURLはnullを返す', () => {
    const url = 'https://maps.google.com/maps?ftid=0x353f1c01efa772a9:0x74ecdda135ec596a&entry=gps';
    const result = extractPlaceInfo(url);
    expect(result).toBeNull();
  });

  it('無効なURLはnullを返す', () => {
    expect(extractPlaceInfo('not-a-url')).toBeNull();
  });
});

// ---- extractCoordsFromHtml (追加パターン) ----

describe('extractCoordsFromHtml - 追加パターン', () => {
  it('@lat,lng パターンから座標を抽出できる', () => {
    const html = `<a href="https://www.google.com/maps/@35.6585805,139.7454329,17z">Link</a>`;
    expect(extractCoordsFromHtml(html)).toEqual({ lat: '35.6585805', lng: '139.7454329' });
  });

  it('ll=lat,lng パターンから座標を抽出できる', () => {
    const html = `<a href="https://maps.google.com/maps?ll=35.6585805,139.7454329">Link</a>`;
    expect(extractCoordsFromHtml(html)).toEqual({ lat: '35.6585805', lng: '139.7454329' });
  });

  it('center= パターンが優先される', () => {
    const html = `center=35.1111%2C139.2222 @35.3333,139.4444`;
    expect(extractCoordsFromHtml(html)).toEqual({ lat: '35.1111', lng: '139.2222' });
  });
});

// ---- expandShortUrl ----

describe('expandShortUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('短縮URLでない場合はそのまま返す', async () => {
    const url = 'https://www.google.com/maps/place/Tokyo';
    expect(await expandShortUrl(url)).toBe(url);
  });

  it('短縮URLを展開する（通常のplace URL）', async () => {
    const expandedUrl = 'https://www.google.com/maps/place/Tokyo+Tower/@35.6585805,139.7454329,17z';
    // redirect: 'manual' で302レスポンスを返す
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 302,
      headers: new Headers({ location: expandedUrl }),
    } as unknown as Response);

    const result = await expandShortUrl('https://maps.app.goo.gl/abc123');
    expect(result).toBe(expandedUrl);
  });

  it('ftid URLの場合、HTMLから座標と場所名を抽出してplace URL形式に変換する', async () => {
    const ftidUrl = 'https://maps.google.com/maps?ftid=0x353f1c01efa772a9:0x74ecdda135ec596a&entry=gps';
    const html = `
      <html><head>
        <meta property="og:title" content="Hidden Hollow">
        <meta property="og:image" content="https://maps.google.com/maps/api/staticmap?center=35.50924045%2C139.7698121&zoom=16">
      </head></html>
    `;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (init?.redirect === 'manual') {
        // followRedirectsManually: maps.app.goo.gl → ftid URL (maps.google.comなのでstopしない)
        if (url.includes('maps.app.goo.gl')) {
          return { status: 302, headers: new Headers({ location: ftidUrl }) } as Response;
        }
        // ftid URL自体は200を返す
        return { status: 200, headers: new Headers() } as Response;
      }
      // ftid URLのHTML取得
      return { text: vi.fn().mockResolvedValue(html) } as unknown as Response;
    });

    const result = await expandShortUrl('https://maps.app.goo.gl/xyz789');
    expect(result).toBe('https://www.google.com/maps/place/Hidden%20Hollow/@35.50924045,139.7698121,17z');
  });

  it('ftid URLで場所名が取れない場合は座標のみの形式にする', async () => {
    const ftidUrl = 'https://maps.google.com/maps?ftid=0x353f1c01efa772a9:0x74ecdda135ec596a&entry=gps';
    const html = `
      <html><head>
        <meta property="og:image" content="https://maps.google.com/maps/api/staticmap?center=35.50924045%2C139.7698121&zoom=16">
      </head></html>
    `;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (init?.redirect === 'manual') {
        if (url.includes('maps.app.goo.gl')) {
          return { status: 302, headers: new Headers({ location: ftidUrl }) } as Response;
        }
        return { status: 200, headers: new Headers() } as Response;
      }
      return { text: vi.fn().mockResolvedValue(html) } as unknown as Response;
    });

    const result = await expandShortUrl('https://maps.app.goo.gl/xyz789');
    expect(result).toBe('https://www.google.com/maps/@35.50924045,139.7698121,17z');
  });

  it('ftid URLで座標が取れない場合はftid URLをそのまま返す', async () => {
    const ftidUrl = 'https://maps.google.com/maps?ftid=0x123:0x456&entry=gps';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (init?.redirect === 'manual') {
        if (url.includes('maps.app.goo.gl')) {
          return { status: 302, headers: new Headers({ location: ftidUrl }) } as Response;
        }
        return { status: 200, headers: new Headers() } as Response;
      }
      return { text: vi.fn().mockResolvedValue('<html><body>No coords</body></html>') } as unknown as Response;
    });

    const result = await expandShortUrl('https://maps.app.goo.gl/nocoords');
    expect(result).toBe(ftidUrl);
  });

  it('Google Mapsに到達したらリダイレクトを停止する', async () => {
    const mapsUrl = 'https://www.google.com/maps/place/Tokyo/@35.6762,139.6503,12z';
    vi.spyOn(globalThis, 'fetch')
      // 1回目: 中間リダイレクト
      .mockResolvedValueOnce({
        status: 302,
        headers: new Headers({ location: 'https://www.google.com/url?q=something' }),
      } as unknown as Response)
      // 2回目: Google Maps URLへリダイレクト
      .mockResolvedValueOnce({
        status: 302,
        headers: new Headers({ location: mapsUrl }),
      } as unknown as Response);

    const result = await expandShortUrl('https://maps.app.goo.gl/multi');
    expect(result).toBe(mapsUrl);
  });

  it('fetchエラー時は元のURLを返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const originalUrl = 'https://maps.app.goo.gl/fail';
    expect(await expandShortUrl(originalUrl)).toBe(originalUrl);
  });
});
