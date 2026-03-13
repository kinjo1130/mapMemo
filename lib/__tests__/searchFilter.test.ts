import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Link } from '@/types/Link';

// useSearchの検索フィルタロジックを抽出してテスト
function filterLinks(links: Link[], searchTerm: string): Link[] {
  if (!searchTerm) return links;
  const searchTerms = searchTerm.toLowerCase().split(/\s+|\u3000+/).filter(term => term.length > 0);
  return links.filter(link => {
    return searchTerms.every(term =>
      (link.name && link.name.toLowerCase().includes(term)) ||
      (link.address && link.address.toLowerCase().includes(term)) ||
      (link.groupName && link.groupName.toLowerCase().includes(term)) ||
      (link.displayName && link.displayName.toLowerCase().includes(term)) ||
      (link.categories && link.categories.some(cat => cat.toLowerCase().includes(term))) ||
      (link.tags && link.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  });
}

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
    const result = filterLinks(links, 'cafe');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('スターバックス渋谷');
  });

  it('共通カテゴリで複数ヒットする', () => {
    const result = filterLinks(links, 'food');
    expect(result).toHaveLength(2);
    expect(result.map(l => l.docId)).toEqual(['1', '3']);
  });

  it('restaurantで検索できる', () => {
    const result = filterLinks(links, 'restaurant');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('すし匠');
  });

  it('カテゴリの部分一致で検索できる', () => {
    const result = filterLinks(links, 'tourist');
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
    const result = filterLinks(links, 'デート');
    expect(result).toHaveLength(2);
    expect(result.map(l => l.docId)).toEqual(['1', '2']);
  });

  it('タグの部分一致で検索できる', () => {
    const result = filterLinks(links, 'ランチ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('レストランB');
  });

  it('タグが一つだけの場所も検索できる', () => {
    const result = filterLinks(links, '子連れ');
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
    const result = filterLinks(links, 'スタバ おしゃれ');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('カテゴリと住所のAND検索ができる', () => {
    const result = filterLinks(links, 'cafe 渋谷');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('全角スペースでもAND検索ができる', () => {
    const result = filterLinks(links, 'restaurant\u3000デート');
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('3');
  });

  it('該当なしの場合は空配列を返す', () => {
    const result = filterLinks(links, 'cafe デート');
    expect(result).toHaveLength(0);
  });
});

describe('検索フィルタ: 既存データ互換性', () => {
  it('categories/tagsがundefinedでもエラーにならない', () => {
    const link = createLink({ docId: '1', name: 'テスト' });
    // @ts-expect-error 既存データのシミュレーション
    delete link.categories;
    // @ts-expect-error 既存データのシミュレーション
    delete link.tags;

    const result = filterLinks([link], 'テスト');
    expect(result).toHaveLength(1);
  });

  it('categories/tagsがundefinedの場合、カテゴリ検索はスキップされる', () => {
    const link = createLink({ docId: '1', name: 'テスト' });
    // @ts-expect-error 既存データのシミュレーション
    delete link.categories;
    // @ts-expect-error 既存データのシミュレーション
    delete link.tags;

    const result = filterLinks([link], 'cafe');
    expect(result).toHaveLength(0);
  });
});
