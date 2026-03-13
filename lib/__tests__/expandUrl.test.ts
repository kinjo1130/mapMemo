import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expandShortUrl, extractCoordsFromHtml, extractPlaceInfo } from '../expandUrl';

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
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      url: expandedUrl,
      text: vi.fn(),
    } as unknown as Response);

    const result = await expandShortUrl('https://maps.app.goo.gl/abc123');
    expect(result).toBe(expandedUrl);
  });

  it('ftid URLの場合、HTMLから座標を抽出して@lat,lng形式に変換する', async () => {
    const ftidUrl = 'https://maps.google.com/maps?ftid=0x353f1c01efa772a9:0x74ecdda135ec596a&entry=gps';
    const html = `
      <html><head>
        <meta property="og:image" content="https://maps.google.com/maps/api/staticmap?center=35.50924045%2C139.7698121&zoom=16">
      </head></html>
    `;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      url: ftidUrl,
      text: vi.fn().mockResolvedValue(html),
    } as unknown as Response);

    const result = await expandShortUrl('https://maps.app.goo.gl/xyz789');
    expect(result).toBe('https://www.google.com/maps/@35.50924045,139.7698121,17z');
  });

  it('ftid URLで座標が取れない場合はftid URLをそのまま返す', async () => {
    const ftidUrl = 'https://maps.google.com/maps?ftid=0x123:0x456&entry=gps';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      url: ftidUrl,
      text: vi.fn().mockResolvedValue('<html><body>No coords</body></html>'),
    } as unknown as Response);

    const result = await expandShortUrl('https://maps.app.goo.gl/nocoords');
    expect(result).toBe(ftidUrl);
  });

  it('fetchエラー時は元のURLを返す', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const originalUrl = 'https://maps.app.goo.gl/fail';
    expect(await expandShortUrl(originalUrl)).toBe(originalUrl);
  });
});
