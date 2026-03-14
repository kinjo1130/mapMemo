import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Link } from '@/types/Link';
import { parseSearchTerms, matchesTerm, filterByDateRange, sortLinks } from '@/lib/search';

function createMockTimestamp(date: Date) {
  return { toDate: () => date } as unknown as Timestamp;
}

function createLink(overrides: Partial<Link> = {}): Link {
  return {
    docId: 'doc1',
    name: 'テスト',
    address: '東京都',
    link: 'https://maps.google.com/test',
    photoUrl: '',
    timestamp: createMockTimestamp(new Date('2024-01-15')),
    userId: 'user1',
    groupId: '',
    lat: 35.6585,
    lng: 139.7454,
    userPictureUrl: '',
    displayName: 'ユーザー1',
    groupName: '',
    groupPictureUrl: '',
    categories: [],
    tags: [],
    ...overrides,
  };
}

describe('parseSearchTerms', () => {
  it('半角スペースで分割する', () => {
    expect(parseSearchTerms('東京 カフェ')).toEqual(['東京', 'カフェ']);
  });

  it('全角スペースで分割する', () => {
    expect(parseSearchTerms('東京\u3000カフェ')).toEqual(['東京', 'カフェ']);
  });

  it('連続スペースを無視する', () => {
    expect(parseSearchTerms('東京  カフェ')).toEqual(['東京', 'カフェ']);
  });

  it('空文字列は空配列を返す', () => {
    expect(parseSearchTerms('')).toEqual([]);
  });

  it('スペースのみは空配列を返す', () => {
    expect(parseSearchTerms('   ')).toEqual([]);
  });

  it('小文字に変換される', () => {
    expect(parseSearchTerms('Cafe TOKYO')).toEqual(['cafe', 'tokyo']);
  });
});

describe('matchesTerm', () => {
  it('名前でマッチする', () => {
    const link = createLink({ name: 'スターバックス' });
    expect(matchesTerm(link, 'スターバックス')).toBe(true);
  });

  it('住所でマッチする', () => {
    const link = createLink({ address: '東京都渋谷区' });
    expect(matchesTerm(link, '渋谷')).toBe(true);
  });

  it('グループ名でマッチする', () => {
    const link = createLink({ groupName: '友達グループ' });
    expect(matchesTerm(link, '友達')).toBe(true);
  });

  it('表示名でマッチする', () => {
    const link = createLink({ displayName: '山田太郎' });
    expect(matchesTerm(link, '山田')).toBe(true);
  });

  it('カテゴリでマッチする', () => {
    const link = createLink({ categories: ['restaurant', 'food'] });
    expect(matchesTerm(link, 'restaurant')).toBe(true);
  });

  it('タグでマッチする', () => {
    const link = createLink({ tags: ['ランチ', 'おすすめ'] });
    expect(matchesTerm(link, 'ランチ')).toBe(true);
  });

  it('マッチしない場合はfalse', () => {
    const link = createLink({ name: 'テスト', address: '東京' });
    expect(matchesTerm(link, '大阪')).toBe(false);
  });

  it('大文字小文字を区別しない', () => {
    const link = createLink({ name: 'Starbucks' });
    expect(matchesTerm(link, 'starbucks')).toBe(true);
  });
});

describe('filterByDateRange', () => {
  const links: Link[] = [
    createLink({ docId: '1', timestamp: createMockTimestamp(new Date('2024-01-10')) }),
    createLink({ docId: '2', timestamp: createMockTimestamp(new Date('2024-01-20')) }),
    createLink({ docId: '3', timestamp: createMockTimestamp(new Date('2024-02-01')) }),
  ];

  it('開始日と終了日の両方を指定', () => {
    const result = filterByDateRange(links, new Date('2024-01-15'), new Date('2024-01-25'));
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('2');
  });

  it('開始日のみ指定', () => {
    const result = filterByDateRange(links, new Date('2024-01-20'), null);
    expect(result).toHaveLength(2);
    expect(result.map(l => l.docId)).toEqual(['2', '3']);
  });

  it('終了日のみ指定', () => {
    const result = filterByDateRange(links, null, new Date('2024-01-15'));
    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('1');
  });

  it('両方nullの場合は全件返す', () => {
    const result = filterByDateRange(links, null, null);
    expect(result).toHaveLength(3);
  });
});

describe('sortLinks', () => {
  const links: Link[] = [
    createLink({ docId: '1', name: 'カフェ', timestamp: createMockTimestamp(new Date('2024-01-10')) }),
    createLink({ docId: '2', name: 'アイス', timestamp: createMockTimestamp(new Date('2024-01-20')) }),
    createLink({ docId: '3', name: 'バー', timestamp: createMockTimestamp(new Date('2024-01-15')) }),
  ];

  it('保存順（timestamp降順）でソート', () => {
    const result = sortLinks(links, 'saved');
    expect(result.map(l => l.docId)).toEqual(['2', '3', '1']);
  });

  it('名前順でソート', () => {
    const result = sortLinks(links, 'name');
    expect(result.map(l => l.docId)).toEqual(['2', '1', '3']);
  });

  it('元の配列を変更しない', () => {
    const original = [...links];
    sortLinks(links, 'name');
    expect(links.map(l => l.docId)).toEqual(original.map(l => l.docId));
  });
});
