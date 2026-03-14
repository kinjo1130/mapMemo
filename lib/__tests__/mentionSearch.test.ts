import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { Link } from '@/types/Link';
import { matchesKeywords } from '../ai/tools';

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

describe('matchesKeywords', () => {
  it('キーワードが空の場合はマッチする', () => {
    const result = matchesKeywords(createLink(), []);
    expect(result).toEqual({ matches: true, score: 1 });
  });

  it('全キーワードがマッチすればスコア1.0', () => {
    const link = createLink({ name: '大分駅前カフェ', address: '大分県大分市' });
    const result = matchesKeywords(link, ['大分', 'カフェ']);
    expect(result.matches).toBe(true);
    expect(result.score).toBe(1);
  });

  it('一部のキーワードのみマッチでもmatchesはtrue', () => {
    const link = createLink({ name: '大分駅前レストラン', address: '大分県大分市' });
    const result = matchesKeywords(link, ['大分', '店']);
    expect(result.matches).toBe(true);
    expect(result.score).toBe(0.5);
  });

  it('キーワードが一つもマッチしない場合はmatchesがfalse', () => {
    const link = createLink({ name: '東京タワー', address: '東京都港区' });
    const result = matchesKeywords(link, ['大分', '店']);
    expect(result.matches).toBe(false);
    expect(result.score).toBe(0);
  });

  it('カテゴリでマッチする', () => {
    const link = createLink({ name: 'テスト店舗', categories: ['restaurant'] });
    const result = matchesKeywords(link, ['restaurant']);
    expect(result.matches).toBe(true);
    expect(result.score).toBe(1);
  });

  it('タグでマッチする', () => {
    const link = createLink({ name: 'テスト店舗', tags: ['ランチ'] });
    const result = matchesKeywords(link, ['ランチ']);
    expect(result.matches).toBe(true);
    expect(result.score).toBe(1);
  });

  it('スコア順でソートできる', () => {
    const links = [
      createLink({ docId: 'a', name: '大分の店', address: '福岡県' }),
      createLink({ docId: 'b', name: '大分駅前カフェ', address: '大分県大分市' }),
      createLink({ docId: 'c', name: '東京カフェ', address: '東京都' }),
    ];

    const scored = links
      .map((link) => ({ link, ...matchesKeywords(link, ['大分', 'カフェ']) }))
      .filter((item) => item.matches)
      .sort((a, b) => b.score - a.score);

    expect(scored.length).toBe(3);
    expect(scored[0].link.docId).toBe('b'); // 両方マッチ（大分+カフェ）
    expect(scored[0].score).toBe(1);
    expect(scored[1].score).toBe(0.5); // 1つだけマッチ
    expect(scored[2].score).toBe(0.5); // 1つだけマッチ
    // 「大分」のみマッチと「カフェ」のみマッチ
    const halfMatchIds = [scored[1].link.docId, scored[2].link.docId].sort();
    expect(halfMatchIds).toEqual(['a', 'c']);
  });
});

describe('toolResult docId収集ロジック', () => {
  it('配列のtoolResultからdocIdを収集できる', () => {
    const toolResults = [
      {
        output: [
          { docId: 'doc1', name: 'Place 1' },
          { docId: 'doc2', name: 'Place 2' },
        ],
      },
      {
        output: [
          { docId: 'doc2', name: 'Place 2' },
          { docId: 'doc3', name: 'Place 3' },
        ],
      },
    ];

    const linkMap = new Map<string, { docId: string; name: string }>();
    for (const toolResult of toolResults) {
      const output = toolResult.output as unknown;
      if (Array.isArray(output)) {
        for (const item of output) {
          if (item && typeof item === 'object' && 'docId' in item) {
            const linkData = item as { docId: string; name: string };
            if (!linkMap.has(linkData.docId)) {
              linkMap.set(linkData.docId, linkData);
            }
          }
        }
      }
    }

    expect(linkMap.size).toBe(3);
    expect(Array.from(linkMap.keys())).toEqual(['doc1', 'doc2', 'doc3']);
  });

  it('エラーオブジェクトが返された場合はスキップする', () => {
    const toolResults = [
      { output: { error: 'something went wrong' } },
      { output: [{ docId: 'doc1', name: 'Place 1' }] },
    ];

    const linkMap = new Map<string, { docId: string; name: string }>();
    for (const toolResult of toolResults) {
      const output = toolResult.output as unknown;
      if (Array.isArray(output)) {
        for (const item of output) {
          if (item && typeof item === 'object' && 'docId' in item) {
            const linkData = item as { docId: string; name: string };
            if (!linkMap.has(linkData.docId)) {
              linkMap.set(linkData.docId, linkData);
            }
          }
        }
      }
    }

    expect(linkMap.size).toBe(1);
    expect(linkMap.has('doc1')).toBe(true);
  });
});
