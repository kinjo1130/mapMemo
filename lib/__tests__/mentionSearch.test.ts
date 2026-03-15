import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Link } from '@/types/Link';

function createLink(overrides: Partial<Link> = {}): Link {
  return {
    docId: 'doc1',
    name: '',
    address: '',
    link: '',
    photoUrl: '',
    userId: 'user1',
    groupId: '',
    timestamp: Timestamp.now(),
    lat: null,
    lng: null,
    userPictureUrl: '',
    displayName: '',
    groupName: '',
    groupPictureUrl: '',
    categories: [],
    tags: [],
    ...overrides,
  };
}

const mockLinks: Link[] = [
  createLink({ docId: 'doc1', name: '大分駅前カフェ', address: '大分県大分市', categories: ['cafe'] }),
  createLink({ docId: 'doc2', name: '東京ラーメン', address: '東京都新宿区', categories: ['restaurant'] }),
  createLink({ docId: 'doc3', name: '大分温泉旅館', address: '大分県別府市', tags: ['温泉'] }),
  createLink({ docId: 'doc4', name: '福岡カフェ', address: '福岡県福岡市', categories: ['cafe'] }),
];

vi.mock('../ai/tools', () => ({
  fetchUserLinks: vi.fn().mockResolvedValue(mockLinks),
}));

// vi.mockの後にimport
const { handleMentionSearch } = await import('../ai/handleMentionSearch');

describe('handleMentionSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('キーワードで検索してマッチするリンクを返す', async () => {
    const results = await handleMentionSearch('大分', 'user1');
    expect(results.length).toBe(2);
    expect(results.map((r) => r.docId).sort()).toEqual(['doc1', 'doc3']);
  });

  it('複数キーワードでAND検索する', async () => {
    const results = await handleMentionSearch('大分 カフェ', 'user1');
    expect(results.length).toBe(1);
    expect(results[0].docId).toBe('doc1');
  });

  it('空のクエリは全件返す', async () => {
    const results = await handleMentionSearch('', 'user1');
    expect(results.length).toBe(4);
  });

  it('マッチしない場合は空配列を返す', async () => {
    const results = await handleMentionSearch('北海道', 'user1');
    expect(results.length).toBe(0);
  });

  it('結果は最大10件に制限される', async () => {
    const { fetchUserLinks } = await import('../ai/tools');
    const manyLinks = Array.from({ length: 15 }, (_, i) =>
      createLink({ docId: `doc${i}`, name: `テスト店${i}`, address: 'テスト' })
    );
    vi.mocked(fetchUserLinks).mockResolvedValueOnce(manyLinks);

    const results = await handleMentionSearch('テスト', 'user1');
    expect(results.length).toBe(10);
  });

  it('カテゴリでマッチする', async () => {
    const results = await handleMentionSearch('cafe', 'user1');
    expect(results.length).toBe(2);
    expect(results.map((r) => r.docId).sort()).toEqual(['doc1', 'doc4']);
  });

  it('タグでマッチする', async () => {
    const results = await handleMentionSearch('温泉', 'user1');
    expect(results.length).toBe(1);
    expect(results[0].docId).toBe('doc3');
  });
});
