import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';

// モジュールモック
const mockShowLoadingAnimation = vi.fn().mockResolvedValue(undefined);
const mockGetProfile = vi.fn();

vi.mock('../init/line', () => ({
  client: {
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
  },
  messagingApiClient: {
    showLoadingAnimation: (...args: unknown[]) => mockShowLoadingAnimation(...args),
  },
}));

const mockSaveUserProfile = vi.fn().mockResolvedValue(undefined);
vi.mock('../User/saveUserProfile', () => ({
  saveUserProfile: (...args: unknown[]) => mockSaveUserProfile(...args),
}));

const mockSendReplyMessage = vi.fn().mockResolvedValue(undefined);
vi.mock('../sendReplyMessage', () => ({
  sendReplyMessage: (...args: unknown[]) => mockSendReplyMessage(...args),
}));

const mockIsWithinUserPeriod = vi.fn().mockResolvedValue(true);
vi.mock('../User/checkUserPeriod', () => ({
  isWithinUserPeriod: (...args: unknown[]) => mockIsWithinUserPeriod(...args),
}));

const mockSendPeriodSettingMessage = vi.fn().mockResolvedValue(undefined);
vi.mock('../sendPeriodSettingMessage', () => ({
  sendPeriodSettingMessage: (...args: unknown[]) => mockSendPeriodSettingMessage(...args),
}));

const mockHandlePostbackEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('../handlePostbackEvent', () => ({
  handlePostbackEvent: (...args: unknown[]) => mockHandlePostbackEvent(...args),
}));

const mockSaveGoogleMapsLink = vi.fn().mockResolvedValue({ error: null });
vi.mock('../saveGoogleMapsLink', () => ({
  saveGoogleMapsLink: (...args: unknown[]) => mockSaveGoogleMapsLink(...args),
}));

const mockCheckUserExists = vi.fn().mockResolvedValue(true);
vi.mock('../User/checkUserExists', () => ({
  checkUserExists: (...args: unknown[]) => mockCheckUserExists(...args),
}));

const mockGetOrFetchGroupInfo = vi.fn().mockResolvedValue({});
vi.mock('../groupUtils', () => ({
  getOrFetchGroupInfo: (...args: unknown[]) => mockGetOrFetchGroupInfo(...args),
}));

vi.mock('../Group/joinGroup', () => ({
  joinGroup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../Group/IsJoinGroup', () => ({
  IsJoinGroup: vi.fn().mockResolvedValue(false),
}));

const mockHandleMentionSearch = vi.fn().mockResolvedValue([]);
vi.mock('../ai/handleMentionSearch', () => ({
  handleMentionSearch: (...args: unknown[]) => mockHandleMentionSearch(...args),
}));

const mockBuildSearchResultMessage = vi.fn().mockReturnValue('検索結果');
vi.mock('../ai/buildSearchResultMessage', () => ({
  buildSearchResultMessage: (...args: unknown[]) => mockBuildSearchResultMessage(...args),
}));

import handler from '../../pages/api/webhook';

// リクエスト/レスポンスのヘルパー
function createMockReqRes(body: unknown) {
  const req = {
    method: 'POST',
    body,
  } as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
  } as unknown as NextApiResponse;

  return { req, res };
}

function createMessageEvent(
  text: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    type: 'message',
    message: { type: 'text', text },
    source: { userId: 'user123', ...overrides },
    replyToken: 'reply-token-123',
    timestamp: Date.now(),
  };
}

describe('webhook handler - showLoadingAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckUserExists.mockResolvedValue(true);
    mockIsWithinUserPeriod.mockResolvedValue(true);
    mockSaveGoogleMapsLink.mockResolvedValue({ error: null });
    mockHandleMentionSearch.mockResolvedValue([]);
    mockBuildSearchResultMessage.mockReturnValue('検索結果');
  });

  it('Google Maps URL送信時にローディングアニメーションが表示される', async () => {
    const event = createMessageEvent('https://maps.google.com/maps?q=Tokyo');
    const { req, res } = createMockReqRes({ events: [event] });

    await handler(req, res);

    expect(mockShowLoadingAnimation).toHaveBeenCalledWith({
      chatId: 'user123',
      loadingSeconds: 20,
    });
    expect(mockShowLoadingAnimation).toHaveBeenCalledTimes(1);
  });

  it('AI検索（メンション+クエリ）時にローディングアニメーションが表示される', async () => {
    const event = createMessageEvent('@mapMemo 渋谷のカフェ');
    const { req, res } = createMockReqRes({ events: [event] });

    await handler(req, res);

    expect(mockShowLoadingAnimation).toHaveBeenCalledWith({
      chatId: 'user123',
      loadingSeconds: 20,
    });
    expect(mockShowLoadingAnimation).toHaveBeenCalledTimes(1);
  });

  it('グループチャットではローディングアニメーションが表示されない（Google Maps URL）', async () => {
    const event = createMessageEvent('https://maps.google.com/maps?q=Tokyo', {
      groupId: 'group123',
    });
    const { req, res } = createMockReqRes({ events: [event] });

    await handler(req, res);

    expect(mockShowLoadingAnimation).not.toHaveBeenCalled();
  });

  it('グループチャットではローディングアニメーションが表示されない（AI検索）', async () => {
    const event = createMessageEvent('@mapMemo 渋谷のカフェ', {
      groupId: 'group123',
    });
    const { req, res } = createMockReqRes({ events: [event] });

    await handler(req, res);

    expect(mockShowLoadingAnimation).not.toHaveBeenCalled();
  });

  it('保存期間変更コマンドではローディングアニメーションが表示されない', async () => {
    const event = createMessageEvent('保存期間変更');
    const { req, res } = createMockReqRes({ events: [event] });

    await handler(req, res);

    expect(mockShowLoadingAnimation).not.toHaveBeenCalled();
  });

  it('メンションのみ（クエリなし）ではローディングアニメーションが表示されない', async () => {
    const event = createMessageEvent('@mapMemo');
    const { req, res } = createMockReqRes({ events: [event] });

    await handler(req, res);

    expect(mockShowLoadingAnimation).not.toHaveBeenCalled();
  });

  it('通常のテキストメッセージではローディングアニメーションが表示されない', async () => {
    const event = createMessageEvent('こんにちは');
    const { req, res } = createMockReqRes({ events: [event] });

    await handler(req, res);

    expect(mockShowLoadingAnimation).not.toHaveBeenCalled();
  });

  it('ローディングアニメーションのエラーは握りつぶして処理が続行される', async () => {
    mockShowLoadingAnimation.mockRejectedValueOnce(new Error('API error'));
    const event = createMessageEvent('https://maps.google.com/maps?q=Tokyo');
    const { req, res } = createMockReqRes({ events: [event] });

    await handler(req, res);

    expect(mockShowLoadingAnimation).toHaveBeenCalled();
    // エラーがあっても保存処理は実行される
    expect(mockSaveGoogleMapsLink).toHaveBeenCalled();
    expect(mockSendReplyMessage).toHaveBeenCalled();
  });
});
