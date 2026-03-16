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

  it('日本語でカテゴリ検索できる（レストラン→restaurant）', async () => {
    const results = await handleMentionSearch('レストラン', 'user1');
    expect(results.length).toBe(1);
    expect(results[0].docId).toBe('doc2');
  });

  it('ANDで0件の場合ORフォールバックで結果を返す', async () => {
    // "大分 ラーメン" → AND: 0件（大分にラーメン店なし）→ OR: 大分2件 + ラーメン1件
    const results = await handleMentionSearch('大分 ラーメン', 'user1');
    expect(results.length).toBe(3);
    // マッチ数が多い順（大分は1件マッチ、ラーメンも1件マッチで同スコア）
    expect(results.map((r) => r.docId).sort()).toEqual(['doc1', 'doc2', 'doc3']);
  });

  it('ORフォールバック時はマッチ数の多い順に並ぶ', async () => {
    const { fetchUserLinks } = await import('../ai/tools');
    const testLinks = [
      createLink({ docId: 'a', name: '大分カフェ', address: '大分県', categories: ['cafe'] }),
      createLink({ docId: 'b', name: '東京ラーメン', address: '東京都' }),
      createLink({ docId: 'c', name: '大分ラーメン', address: '大分県' }),
    ];
    vi.mocked(fetchUserLinks).mockResolvedValueOnce(testLinks);

    // "大分 ラーメン カフェ" → AND: 0件 → OR: doc_a(大分+カフェ=2), doc_c(大分+ラーメン=2), doc_b(ラーメン=1)
    const results = await handleMentionSearch('大分 ラーメン カフェ', 'user1');
    expect(results.length).toBe(3);
    // スコア2のものが先
    expect(results[0].docId).not.toBe('b');
    expect(results[2].docId).toBe('b');
  });
});
