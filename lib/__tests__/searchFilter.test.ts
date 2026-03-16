import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Link } from '@/types/Link';
import { filterByKeywords, filterByKeywordsRanked } from '@/lib/search';

const mockTimestamp = { toDate: () => new Date('2024-01-01') } as unknown as Timestamp;

function createLink(overrides: Partial<Link> = {}): Link {
  return {
    docId: 'doc1',
    name: 'スターバックス',
    address: '東京都渋谷区',
    link: 'https://maps.google.com/test',
    photoUrl: '',
    timestamp: mockTimestamp,
    userId: 'user1',
    groupId: '',
    lat: 35.6585,
    lng: 139.7454,
    userPictureUrl: '',
    displayName: 'テストユーザー',
    groupName: '',
    groupPictureUrl: '',
    categories: [],
    tags: [],
    ...overrides,
  };
}

describe('検索フィルタ: categories', () => {
  const links: Link[] = [
    createLink({ docId: '1', name: 'スターバックス渋谷', categories: ['cafe', 'food', 'establishment'] }),
    createLink({ docId: '2', name: '東京タワー', categories: ['tourist_attraction', 'point_of_interest'] }),
    createLink({ docId: '3', name: 'すし匠', categories: ['restaurant', 'food'] }),
  ];

  it('カテゴリ名で検索できる', () => {
    const result = filterByKeywords(links, 'cafe');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('スターバックス渋谷');
  });

  it('共通カテゴリで複数ヒットする', () => {
    const result = filterByKeywords(links, 'food');
    expect(result).toHaveLength(2);
    expect(result.map(l => l.docId)).toEqual(['1', '3']);
  });

  it('restaurantで検索できる', () => {
    const result = filterByKeywords(links, 'restaurant');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('すし匠');
  });

  it('カテゴリの部分一致で検索できる', () => {
    const result = filterByKeywords(links, 'tourist');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('東京タワー');
  });
});

describe('検索フィルタ: tags', () => {
  const links: Link[] = [
    createLink({ docId: '1', name: 'カフェA', tags: ['デート', 'おしゃれ'] }),
    createLink({ docId: '2', name: 'レストランB', tags: ['ランチ', 'デート'] }),
    createLink({ docId: '3', name: '公園C', tags: ['散歩', '子連れ'] }),
  ];

  it('タグ名で検索できる', () => {
    const result = filterByKeywords(links, 'デート');
    expect(result).toHaveLength(2);
    expect(result.map(l => l.docId)).toEqual(['1', '2']);
  });

  it('タグの部分一致で検索できる', () => {
    const result = filterByKeywords(links, 'ランチ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('レストランB');
  });

  it('タグが一つだけの場所も検索できる', () => {
    const result = filterByKeywords(links, '子連れ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('公園C');
  });
});

describe('検索フィルタ: 複合検索', () => {
  const links: Link[] = [
    createLink({ docId: '1', name: 'スタバ渋谷', address: '東京都渋谷区', categories: ['cafe'], tags: ['おしゃれ'] }),
    createLink({ docId: '2', name: 'スタバ新宿', address: '東京都新宿区', categories: ['cafe'], tags: ['仕事'] }),
    createLink({ docId: '3', name: '焼肉太郎', address: '東京都渋谷区', categories: ['restaurant'], tags: ['デート'] }),
  ];

  it('名前とタグのAND検索ができる', () => {
    const result = filterByKeywords(links, 'スタバ おしゃれ');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('カテゴリと住所のAND検索ができる', () => {
    const result = filterByKeywords(links, 'cafe 渋谷');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('全角スペースでもAND検索ができる', () => {
    const result = filterByKeywords(links, 'restaurant\u3000デート');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('3');
  });

  it('該当なしの場合は空配列を返す', () => {
    const result = filterByKeywords(links, 'cafe デート');
    expect(result).toHaveLength(0);
  });
});

describe('検索フィルタ: editorialSummary', () => {
  const links: Link[] = [
    createLink({ docId: '1', name: '広島のお店', editorialSummary: '広島風お好み焼きが人気の飲食店' }),
    createLink({ docId: '2', name: '東京ラーメン', editorialSummary: '濃厚豚骨ラーメンの名店' }),
    createLink({ docId: '3', name: 'カフェ', editorialSummary: null }),
  ];

  it('editorialSummaryの内容で検索できる', () => {
    const result = filterByKeywords(links, '飲食店');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('editorialSummaryの部分一致で検索できる', () => {
    const result = filterByKeywords(links, '豚骨');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('2');
  });

  it('editorialSummaryがnullの場合はスキップされる', () => {
    const result = filterByKeywords(links, '飲食');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('editorialSummaryと他フィールドのAND検索ができる', () => {
    const result = filterByKeywords(links, '広島 飲食店');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });
});

describe('検索フィルタ: カテゴリ日本語マッチ', () => {
  const links: Link[] = [
    createLink({ docId: '1', name: 'すし匠', categories: ['restaurant', 'food'] }),
    createLink({ docId: '2', name: 'ドトール', categories: ['cafe'] }),
    createLink({ docId: '3', name: '上野公園', categories: ['park'] }),
  ];

  it('日本語でカテゴリ検索できる（レストラン→restaurant）', () => {
    const result = filterByKeywords(links, 'レストラン');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('日本語でカテゴリ検索できる（カフェ→cafe）', () => {
    const result = filterByKeywords(links, 'カフェ');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('2');
  });

  it('日本語でカテゴリ検索できる（公園→park）', () => {
    const result = filterByKeywords(links, '公園');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('3');
  });

  it('日本語カテゴリの部分一致で検索できる（飲食→food）', () => {
    const result = filterByKeywords(links, '飲食');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });
});

describe('検索フィルタ: filterByKeywordsRanked', () => {
  const links: Link[] = [
    createLink({ docId: '1', name: '大分カフェ', address: '大分県大分市', categories: ['cafe'] }),
    createLink({ docId: '2', name: '東京ラーメン', address: '東京都新宿区', categories: ['restaurant'] }),
    createLink({ docId: '3', name: '大分ラーメン', address: '大分県別府市' }),
    createLink({ docId: '4', name: '福岡カフェ', address: '福岡県福岡市', categories: ['cafe'] }),
  ];

  it('AND一致がある場合はAND結果を返す', () => {
    const result = filterByKeywordsRanked(links, '大分 カフェ');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('AND一致が0件の場合ORフォールバック', () => {
    const result = filterByKeywordsRanked(links, '大分 レストラン');
    expect(result.length).toBeGreaterThan(0);
    // 大分(doc1,doc3) + レストラン(doc2) = 3件
    expect(result).toHaveLength(3);
  });

  it('ORフォールバック時はマッチ数の多い順', () => {
    // "大分 ラーメン カフェ" → doc1(大分+カフェ=2), doc3(大分+ラーメン=2), doc2(ラーメン=1), doc4(カフェ=1)
    const result = filterByKeywordsRanked(links, '大分 ラーメン カフェ');
    expect(result).toHaveLength(4);
    // スコア2のdoc1,doc3が先、スコア1のdoc2,doc4が後
    const first2 = result.slice(0, 2).map(l => l.docId).sort();
    expect(first2).toEqual(['1', '3']);
  });

  it('キーワード1つの場合はAND検索のみ（ORフォールバックなし）', () => {
    const result = filterByKeywordsRanked(links, '北海道');
    expect(result).toHaveLength(0);
  });

  it('空のクエリは全件返す', () => {
    const result = filterByKeywordsRanked(links, '');
    expect(result).toHaveLength(4);
  });
});

describe('検索フィルタ: 既存データ互換性', () => {
  it('categories/tagsがundefinedでもエラーにならない', () => {
    const link = createLink({ docId: '1', name: 'テスト' });
    // @ts-expect-error 既存データのシミュレーション
    delete link.categories;
    // @ts-expect-error 既存データのシミュレーション
    delete link.tags;

    const result = filterByKeywords([link], 'テスト');
    expect(result).toHaveLength(1);
  });

  it('categories/tagsがundefinedの場合、カテゴリ検索はスキップされる', () => {
    const link = createLink({ docId: '1', name: 'テスト' });
    // @ts-expect-error 既存データのシミュレーション
    delete link.categories;
    // @ts-expect-error 既存データのシミュレーション
    delete link.tags;

    const result = filterByKeywords([link], 'cafe');
    expect(result).toHaveLength(0);
  });
});
