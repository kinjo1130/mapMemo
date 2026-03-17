import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Link } from '@/types/Link';
import { deduplicateLinks } from '@/lib/deduplicateLinks';

const mockTimestamp = { toDate: () => new Date('2024-01-01') } as unknown as Timestamp;

function createLink(overrides: Partial<Link> = {}): Link {
  return {
    docId: 'doc1',
    name: 'テスト場所',
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

describe('deduplicateLinks', () => {
  it('同じ docId のリンクが重複している場合、最初の1件のみ残す', () => {
    const links = [
      createLink({ docId: 'doc1', name: 'Hidden Hollow' }),
      createLink({ docId: 'doc1', name: 'Hidden Hollow' }),
    ];

    const result = deduplicateLinks(links);

    expect(result).toHaveLength(1);
    expect(result[0].docId).toBe('doc1');
  });

  it('異なる docId のリンクはすべて残す', () => {
    const links = [
      createLink({ docId: 'doc1', name: '場所A' }),
      createLink({ docId: 'doc2', name: '場所B' }),
      createLink({ docId: 'doc3', name: '場所C' }),
    ];

    const result = deduplicateLinks(links);

    expect(result).toHaveLength(3);
  });

  it('複数の重複がある場合、それぞれ1件ずつ残す', () => {
    const links = [
      createLink({ docId: 'doc1', name: '場所A' }),
      createLink({ docId: 'doc2', name: '場所B' }),
      createLink({ docId: 'doc1', name: '場所A' }),
      createLink({ docId: 'doc2', name: '場所B' }),
      createLink({ docId: 'doc3', name: '場所C' }),
    ];

    const result = deduplicateLinks(links);

    expect(result).toHaveLength(3);
    expect(result.map(l => l.docId)).toEqual(['doc1', 'doc2', 'doc3']);
  });

  it('空の配列を渡した場合、空の配列を返す', () => {
    expect(deduplicateLinks([])).toEqual([]);
  });

  it('重複がない場合、元の配列と同じ内容を返す', () => {
    const links = [
      createLink({ docId: 'doc1' }),
      createLink({ docId: 'doc2' }),
    ];

    const result = deduplicateLinks(links);

    expect(result).toHaveLength(2);
  });
});
