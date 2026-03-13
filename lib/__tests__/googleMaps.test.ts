import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlaceDetails } from '../googleMaps';

// expandUrl モジュールをモック
vi.mock('../expandUrl', () => ({
  expandShortUrl: vi.fn(),
  extractPlaceInfo: vi.fn(),
}));

// Storage モジュールをモック
vi.mock('../Storage/GoogleMapPhotoUrl', () => ({
  fetchAndSaveToFirestore: vi.fn().mockResolvedValue('https://storage.example.com/photo.jpg'),
}));

import { expandShortUrl, extractPlaceInfo } from '../expandUrl';

const mockExpandShortUrl = vi.mocked(expandShortUrl);
const mockExtractPlaceInfo = vi.mocked(extractPlaceInfo);

// Places API のレスポンスヘルパー
function mockFetchResponses(...responses: Array<{ ok?: boolean; json: () => unknown }>) {
  const fetchMock = vi.spyOn(globalThis, 'fetch');
  for (const resp of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: resp.ok ?? true,
      json: async () => resp.json(),
    } as Response);
  }
  return fetchMock;
}

const PLACE_DETAILS_RESPONSE = {
  status: 'OK',
  result: {
    name: 'Test Place',
    formatted_address: '東京都渋谷区',
    geometry: { location: { lat: 35.6585, lng: 139.7454 } },
    photos: [{ photo_reference: 'photo_ref_123' }],
  },
};

describe('getPlaceDetails', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
    // re-mock after restoreAllMocks
    vi.mocked(expandShortUrl).mockReset();
    vi.mocked(extractPlaceInfo).mockReset();
  });

  it('テキストクエリがある場合、findplacefromtextを使用する', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps?q=Tokyo+Tower');
    mockExtractPlaceInfo.mockReturnValue({ query: 'Tokyo Tower' });

    const fetchMock = mockFetchResponses(
      { json: () => ({ status: 'OK', candidates: [{ place_id: 'place_abc' }] }) },
      { json: () => PLACE_DETAILS_RESPONSE },
    );

    const result = await getPlaceDetails('https://maps.app.goo.gl/abc');

    // findplacefromtext が呼ばれたことを確認
    expect(fetchMock.mock.calls[0][0]).toContain('findplacefromtext');
    expect(fetchMock.mock.calls[0][0]).toContain('input=Tokyo+Tower');
    expect(result.name).toBe('Test Place');
    expect(result.address).toBe('東京都渋谷区');
  });

  it('名前+座標がある場合、findplacefromtextにlocationbiasを付ける', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps/place/Tokyo+Tower/@35.6585,139.7454,17z');
    mockExtractPlaceInfo.mockReturnValue({
      name: 'Tokyo Tower',
      coordinates: { lat: 35.6585, lng: 139.7454 },
    });

    const fetchMock = mockFetchResponses(
      { json: () => ({ status: 'OK', candidates: [{ place_id: 'place_abc' }] }) },
      { json: () => PLACE_DETAILS_RESPONSE },
    );

    await getPlaceDetails('https://maps.app.goo.gl/abc');

    const searchCallUrl = fetchMock.mock.calls[0][0] as string;
    expect(searchCallUrl).toContain('findplacefromtext');
    expect(searchCallUrl).toContain('locationbias=point');
  });

  it('座標のみの場合、nearbysearchを使用する', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps/@39.0267995,-77.844326,17z');
    mockExtractPlaceInfo.mockReturnValue({
      coordinates: { lat: 39.0267995, lng: -77.844326 },
    });

    const fetchMock = mockFetchResponses(
      { json: () => ({ status: 'OK', results: [{ place_id: 'place_nearby' }] }) },
      { json: () => PLACE_DETAILS_RESPONSE },
    );

    const result = await getPlaceDetails('https://maps.app.goo.gl/ftid123');

    // nearbysearch が呼ばれたことを確認
    const searchCallUrl = fetchMock.mock.calls[0][0] as string;
    expect(searchCallUrl).toContain('nearbysearch');
    expect(searchCallUrl).toContain('location=39.0267995');
    expect(searchCallUrl).toContain('rankby=distance');
    expect(result.name).toBe('Test Place');
  });

  it('extractPlaceInfoがnullを返した場合、エラーをスローする', async () => {
    mockExpandShortUrl.mockResolvedValue('https://maps.google.com/maps?ftid=0x123:0x456');
    mockExtractPlaceInfo.mockReturnValue(null);

    await expect(getPlaceDetails('https://maps.app.goo.gl/bad')).rejects.toThrow('Invalid Google Maps URL');
  });

  it('APIキーが未設定の場合、エラーをスローする', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps?q=test');
    mockExtractPlaceInfo.mockReturnValue({ query: 'test' });

    await expect(getPlaceDetails('https://maps.app.goo.gl/abc')).rejects.toThrow('Google Maps API key is not set');
  });

  it('findplacefromtextが候補なしの場合、エラーをスローする', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps?q=nonexistent');
    mockExtractPlaceInfo.mockReturnValue({ query: 'nonexistent' });

    mockFetchResponses(
      { json: () => ({ status: 'OK', candidates: [] }) },
    );

    await expect(getPlaceDetails('https://maps.app.goo.gl/abc')).rejects.toThrow('Place not found');
  });

  it('nearbysearchが結果なしの場合、エラーをスローする', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps/@0,0,17z');
    mockExtractPlaceInfo.mockReturnValue({
      coordinates: { lat: 0, lng: 0 },
    });

    mockFetchResponses(
      { json: () => ({ status: 'OK', results: [] }) },
    );

    await expect(getPlaceDetails('https://maps.app.goo.gl/abc')).rejects.toThrow('Place not found');
  });

  it('nearbysearch APIエラーの場合、エラーをスローする', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps/@35.6,139.7,17z');
    mockExtractPlaceInfo.mockReturnValue({
      coordinates: { lat: 35.6, lng: 139.7 },
    });

    mockFetchResponses(
      { json: () => ({ status: 'REQUEST_DENIED', error_message: 'API key invalid' }) },
    );

    await expect(getPlaceDetails('https://maps.app.goo.gl/abc')).rejects.toThrow('API key invalid');
  });
});
