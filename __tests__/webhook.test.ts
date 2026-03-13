import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

// Firebase
vi.mock('@/lib/init/firebase', () => ({
  db: 'mock-db',
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args: any[]) => ({ path: args.join('/') })),
  getDoc: vi.fn(),
  collection: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  runTransaction: vi.fn(),
  arrayUnion: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

// LINE
vi.mock('@/lib/init/line', () => ({
  client: {
    getProfile: vi.fn(),
    getGroupSummary: vi.fn(),
  },
}));

vi.mock('@/lib/User/saveUserProfile', () => ({
  saveUserProfile: vi.fn(),
}));

vi.mock('@/lib/sendReplyMessage', () => ({
  sendReplyMessage: vi.fn(),
}));

vi.mock('@/lib/sendPeriodSettingMessage', () => ({
  sendPeriodSettingMessage: vi.fn(),
}));

vi.mock('@/lib/handlePostbackEvent', () => ({
  handlePostbackEvent: vi.fn(),
}));

vi.mock('@/lib/saveGoogleMapsLink', () => ({
  saveGoogleMapsLink: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/User/checkUserExists', () => ({
  checkUserExists: vi.fn(),
}));

vi.mock('@/lib/groupUtils', () => ({
  getOrFetchGroupInfo: vi.fn(),
}));

vi.mock('@/lib/Group/joinGroup', () => ({
  joinGroup: vi.fn(),
}));

vi.mock('@/lib/Group/IsJoinGroup', () => ({
  IsJoinGroup: vi.fn(),
}));

import { getDoc } from 'firebase/firestore';
import { sendReplyMessage } from '@/lib/sendReplyMessage';
import { sendPeriodSettingMessage } from '@/lib/sendPeriodSettingMessage';
import { saveGoogleMapsLink } from '@/lib/saveGoogleMapsLink';
import { getOrFetchGroupInfo } from '@/lib/groupUtils';

// Import handler
import handler from '@/pages/api/webhook';

const mockGetDoc = vi.mocked(getDoc);

function createMockReqRes(method: string, body: any) {
  const req = { method, body } as any;
  const res = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as any;
  return { req, res };
}

function mockUserDoc(exists: boolean, data?: Record<string, any>) {
  mockGetDoc.mockResolvedValue({
    exists: () => exists,
    data: () => data || null,
  } as any);
}

describe('webhook handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMockReqRes('GET', {});
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 200 immediately for POST requests', async () => {
    mockUserDoc(false);
    const { req, res } = createMockReqRes('POST', {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: 'hello' },
          source: { userId: 'user1' },
          replyToken: 'token1',
          timestamp: Date.now(),
        },
      ],
    });

    await handler(req, res);

    // 200が最初に呼ばれることを確認
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('OK');
  });

  it('should skip processing for unregistered users', async () => {
    mockUserDoc(false);
    const { req, res } = createMockReqRes('POST', {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: 'https://maps.google.com/test' },
          source: { userId: 'user1' },
          replyToken: 'token1',
          timestamp: Date.now(),
        },
      ],
    });

    await handler(req, res);
    expect(saveGoogleMapsLink).not.toHaveBeenCalled();
  });

  it('should handle period setting message', async () => {
    mockUserDoc(true, { userId: 'user1', displayName: 'Test' });
    const { req, res } = createMockReqRes('POST', {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: '保存期間変更' },
          source: { userId: 'user1' },
          replyToken: 'token1',
          timestamp: Date.now(),
        },
      ],
    });

    await handler(req, res);
    expect(sendPeriodSettingMessage).toHaveBeenCalledWith('token1');
  });

  it('should reject messages outside user period', async () => {
    mockUserDoc(true, {
      userId: 'user1',
      displayName: 'Test',
      period: {
        startDate: '2020-01-01',
        endDate: '2020-12-31',
      },
    });
    const { req, res } = createMockReqRes('POST', {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: 'https://maps.google.com/test' },
          source: { userId: 'user1' },
          replyToken: 'token1',
          timestamp: Date.now(), // 2020年外
        },
      ],
    });

    await handler(req, res);
    expect(sendReplyMessage).toHaveBeenCalledWith(
      'token1',
      'この期間にはメッセージを保存できません。'
    );
    expect(saveGoogleMapsLink).not.toHaveBeenCalled();
  });

  it('should save Google Maps link with user profile and group data', async () => {
    const userData = {
      userId: 'user1',
      displayName: 'Test User',
      pictureUrl: 'https://pic.example.com',
      statusMessage: 'hello',
    };
    mockUserDoc(true, userData);
    const groupInfo = {
      groupId: 'group1',
      groupName: 'Test Group',
      members: ['user1'],
      pictureUrl: 'https://group.pic',
    };
    vi.mocked(getOrFetchGroupInfo).mockResolvedValue(groupInfo as any);

    const { req, res } = createMockReqRes('POST', {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: 'Check https://maps.google.com/test' },
          source: { userId: 'user1', groupId: 'group1' },
          replyToken: 'token1',
          timestamp: Date.now(),
        },
      ],
    });

    await handler(req, res);

    // saveGoogleMapsLinkにuserProfileとgroupDataが渡されることを確認
    expect(saveGoogleMapsLink).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user1',
        groupId: 'group1',
        userProfile: expect.objectContaining({
          displayName: 'Test User',
        }),
        groupData: expect.objectContaining({
          groupId: 'group1',
          groupName: 'Test Group',
        }),
      })
    );
  });

  it('should fetch group info and user doc in parallel', async () => {
    const userData = { userId: 'user1', displayName: 'Test' };
    mockUserDoc(true, userData);
    vi.mocked(getOrFetchGroupInfo).mockResolvedValue({
      groupId: 'group1',
      groupName: 'G',
      members: ['user1'],
    } as any);

    const { req, res } = createMockReqRes('POST', {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: 'hello' },
          source: { userId: 'user1', groupId: 'group1' },
          replyToken: 'token1',
          timestamp: Date.now(),
        },
      ],
    });

    await handler(req, res);

    // 両方呼ばれることを確認（Promise.allで並列実行）
    expect(getOrFetchGroupInfo).toHaveBeenCalledWith('group1', 'user1');
    expect(mockGetDoc).toHaveBeenCalled();
  });
});
