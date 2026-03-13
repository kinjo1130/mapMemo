import { describe, it, expect, vi, beforeEach } from 'vitest';

// fetchをモック
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { expandShortUrl, extractPlaceInfo } from '@/lib/expandUrl';

describe('extractPlaceInfo', () => {
  it('should extract query from q parameter', () => {
    const result = extractPlaceInfo('https://www.google.com/maps?q=Tokyo+Tower');
    expect(result).toEqual({ name: undefined, query: 'Tokyo Tower', coordinates: undefined });
  });

  it('should extract name from /place/ path', () => {
    const result = extractPlaceInfo('https://www.google.com/maps/place/Tokyo+Tower/@35.6585805,139.7454329');
    expect(result).toEqual({
      name: 'Tokyo+Tower',
      query: undefined,
      coordinates: { lat: 35.6585805, lng: 139.7454329 },
    });
  });

  it('should extract coordinates from @ pattern', () => {
    const result = extractPlaceInfo('https://www.google.com/maps/@35.6762,139.6503,15z');
    expect(result).toEqual({
      name: undefined,
      query: undefined,
      coordinates: { lat: 35.6762, lng: 139.6503 },
    });
  });

  it('should return null for ftid-only URL (no place info)', () => {
    const result = extractPlaceInfo(
      'https://www.google.com/maps?ftid=0x353f1c01efa772a9:0x74ecdda135ec596a&entry=gps'
    );
    expect(result).toBeNull();
  });

  it('should return null for invalid URL', () => {
    const result = extractPlaceInfo('not-a-url');
    expect(result).toBeNull();
  });
});

describe('expandShortUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the URL as-is if not a short URL', async () => {
    const url = 'https://www.google.com/maps/place/Tokyo+Tower';
    const result = await expandShortUrl(url);
    expect(result).toBe(url);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should expand goo.gl short URLs', async () => {
    const expandedUrl = 'https://www.google.com/maps/place/Tokyo+Tower/@35.65,139.74';
    mockFetch.mockResolvedValue({ url: expandedUrl });

    const result = await expandShortUrl('https://maps.app.goo.gl/abc123');
    expect(result).toBe(expandedUrl);
  });

  it('should resolve ftid-only URL via CID redirect', async () => {
    // 1回目: 短縮URL展開 → ftid付きURL
    const ftidUrl = 'https://www.google.com/maps?ftid=0x353f1c01efa772a9:0x74ecdda135ec596a&entry=gps';
    // 2回目: CID URL → place付きURL
    const finalUrl = 'https://www.google.com/maps/place/Test+Place/@35.65,139.74,17z';

    mockFetch
      .mockResolvedValueOnce({ url: ftidUrl })    // 短縮URL展開
      .mockResolvedValueOnce({ url: finalUrl });   // CID URLリダイレクト

    const result = await expandShortUrl('https://maps.app.goo.gl/test123');
    expect(result).toBe(finalUrl);

    // CID URLが正しく生成されたか確認
    // 0x74ecdda135ec596a = 8425352687367510378
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://www.google.com/maps?cid=8425352687367510378', {
      method: 'HEAD',
      redirect: 'follow',
    });
  });

  it('should return ftid URL if CID redirect also has no place info', async () => {
    const ftidUrl = 'https://www.google.com/maps?ftid=0x353f1c01efa772a9:0x74ecdda135ec596a';
    // CID URLもplace情報なし
    const cidRedirect = 'https://www.google.com/maps?cid=8425352687367510378';

    mockFetch
      .mockResolvedValueOnce({ url: ftidUrl })
      .mockResolvedValueOnce({ url: cidRedirect });

    const result = await expandShortUrl('https://maps.app.goo.gl/test456');
    // CID解決後もplace情報がない場合は元のftid URLを返す
    expect(result).toBe(ftidUrl);
  });
});
