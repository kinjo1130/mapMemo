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
    types: ['restaurant', 'food', 'point_of_interest', 'establishment'],
    place_id: 'place_abc',
    rating: 4.2,
    user_ratings_total: 1500,
    price_level: 2,
    opening_hours: {
      weekday_text: [
        '月曜日: 11:00～22:00',
        '火曜日: 11:00～22:00',
        '水曜日: 11:00～22:00',
        '木曜日: 11:00～22:00',
        '金曜日: 11:00～23:00',
        '土曜日: 11:00～23:00',
        '日曜日: 11:00～21:00',
      ],
    },
    website: 'https://example.com',
    formatted_phone_number: '03-1234-5678',
    url: 'https://maps.google.com/?cid=123456789',
    business_status: 'OPERATIONAL',
    editorial_summary: { overview: '渋谷にある人気のレストラン' },
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
    expect(result.categories).toEqual(['restaurant', 'food', 'point_of_interest', 'establishment']);
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

  it('追加プロパティがすべて正しくマッピングされる', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps?q=Tokyo+Tower');
    mockExtractPlaceInfo.mockReturnValue({ query: 'Tokyo Tower' });

    mockFetchResponses(
      { json: () => ({ status: 'OK', candidates: [{ place_id: 'place_abc' }] }) },
      { json: () => PLACE_DETAILS_RESPONSE },
    );

    const result = await getPlaceDetails('https://maps.app.goo.gl/abc');

    expect(result.placeId).toBe('place_abc');
    expect(result.rating).toBe(4.2);
    expect(result.userRatingsTotal).toBe(1500);
    expect(result.priceLevel).toBe(2);
    expect(result.openingHours).toEqual([
      '月曜日: 11:00～22:00',
      '火曜日: 11:00～22:00',
      '水曜日: 11:00～22:00',
      '木曜日: 11:00～22:00',
      '金曜日: 11:00～23:00',
      '土曜日: 11:00～23:00',
      '日曜日: 11:00～21:00',
    ]);
    expect(result.website).toBe('https://example.com');
    expect(result.phoneNumber).toBe('03-1234-5678');
    expect(result.googleMapsUrl).toBe('https://maps.google.com/?cid=123456789');
    expect(result.businessStatus).toBe('OPERATIONAL');
    expect(result.editorialSummary).toBe('渋谷にある人気のレストラン');
  });

  it('追加プロパティがAPIレスポンスにない場合、nullを返す', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps?q=Simple+Place');
    mockExtractPlaceInfo.mockReturnValue({ query: 'Simple Place' });

    const minimalResponse = {
      status: 'OK',
      result: {
        name: 'Simple Place',
        formatted_address: '東京都新宿区',
        geometry: { location: { lat: 35.69, lng: 139.70 } },
        types: ['point_of_interest'],
      },
    };

    mockFetchResponses(
      { json: () => ({ status: 'OK', candidates: [{ place_id: 'place_minimal' }] }) },
      { json: () => minimalResponse },
    );

    const result = await getPlaceDetails('https://maps.app.goo.gl/minimal');

    expect(result.placeId).toBe('place_minimal');
    expect(result.rating).toBeNull();
    expect(result.userRatingsTotal).toBeNull();
    expect(result.priceLevel).toBeNull();
    expect(result.openingHours).toBeNull();
    expect(result.website).toBeNull();
    expect(result.phoneNumber).toBeNull();
    expect(result.googleMapsUrl).toBeNull();
    expect(result.businessStatus).toBeNull();
    expect(result.editorialSummary).toBeNull();
  });

  it('Place Details APIのfieldsパラメータに追加プロパティが含まれる', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps?q=Test');
    mockExtractPlaceInfo.mockReturnValue({ query: 'Test' });

    const fetchMock = mockFetchResponses(
      { json: () => ({ status: 'OK', candidates: [{ place_id: 'place_fields' }] }) },
      { json: () => PLACE_DETAILS_RESPONSE },
    );

    await getPlaceDetails('https://maps.app.goo.gl/fields');

    const detailsCallUrl = fetchMock.mock.calls[1][0] as string;
    expect(detailsCallUrl).toContain('place_id');
    expect(detailsCallUrl).toContain('rating');
    expect(detailsCallUrl).toContain('user_ratings_total');
    expect(detailsCallUrl).toContain('price_level');
    expect(detailsCallUrl).toContain('opening_hours');
    expect(detailsCallUrl).toContain('website');
    expect(detailsCallUrl).toContain('formatted_phone_number');
    expect(detailsCallUrl).toContain('url');
    expect(detailsCallUrl).toContain('business_status');
    expect(detailsCallUrl).toContain('editorial_summary');
  });

  it('APIレスポンスにtypesがない場合、categoriesは空配列を返す', async () => {
    mockExpandShortUrl.mockResolvedValue('https://www.google.com/maps?q=Unknown+Place');
    mockExtractPlaceInfo.mockReturnValue({ query: 'Unknown Place' });

    const responseWithoutTypes = {
      status: 'OK',
      result: {
        name: 'Unknown Place',
        formatted_address: '不明な場所',
        geometry: { location: { lat: 35.0, lng: 139.0 } },
      },
    };

    mockFetchResponses(
      { json: () => ({ status: 'OK', candidates: [{ place_id: 'place_no_types' }] }) },
      { json: () => responseWithoutTypes },
    );

    const result = await getPlaceDetails('https://maps.app.goo.gl/notypes');
    expect(result.categories).toEqual([]);
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
