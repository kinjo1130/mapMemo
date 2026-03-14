import { describe, it, expect } from 'vitest';
import { buildSearchResultMessage } from '../ai/buildSearchResultMessage';
import { Link } from '@/types/Link';

function createMockLink(overrides: Partial<Link> = {}): Link {
  return {
    name: 'テスト場所',
    address: '東京都渋谷区',
    link: 'https://maps.google.com/maps?q=Tokyo',
    googleMapsUrl: 'https://maps.google.com/maps?q=Tokyo',
    photoUrl: 'https://example.com/photo.jpg',
    rating: 4.5,
    userRatingsTotal: 100,
    tags: ['カフェ', 'おしゃれ'],
    ...overrides,
  } as Link;
}

describe('buildSearchResultMessage', () => {
  it('0件の場合は「見つかりませんでした」バブルを返す', () => {
    const result = buildSearchResultMessage([], 'カフェ');

    expect(result.type).toBe('flex');
    const contents = (result as any).contents;
    expect(contents.type).toBe('bubble');
    expect(contents.body.contents[1].text).toContain('カフェ');
    expect(contents.body.contents[1].text).toContain('見つかりませんでした');
  });

  it('4件以下の場合は全件をカルーセル表示し「さらに見る」バブルなし', () => {
    const links = Array.from({ length: 4 }, (_, i) =>
      createMockLink({ name: `場所${i + 1}` })
    );

    const result = buildSearchResultMessage(links, 'カフェ');

    const contents = (result as any).contents;
    expect(contents.type).toBe('carousel');
    expect(contents.contents).toHaveLength(4);
    // 全バブルが場所データであること（「さらに見る」バブルがないこと）
    contents.contents.forEach((bubble: any) => {
      expect(bubble.footer.contents[0].action.label).toBe('開く');
    });
  });

  it('1件の場合もカルーセル表示される', () => {
    const links = [createMockLink({ name: '唯一の場所' })];

    const result = buildSearchResultMessage(links, 'ラーメン');

    const contents = (result as any).contents;
    expect(contents.type).toBe('carousel');
    expect(contents.contents).toHaveLength(1);
  });

  it('5件以上の場合は4件 + 「さらに見る」バブルを表示', () => {
    const links = Array.from({ length: 7 }, (_, i) =>
      createMockLink({ name: `場所${i + 1}` })
    );

    const result = buildSearchResultMessage(links, 'カフェ');

    const contents = (result as any).contents;
    expect(contents.type).toBe('carousel');
    expect(contents.contents).toHaveLength(5); // 4件 + さらに見る

    // 最初の4件は通常のバブル
    for (let i = 0; i < 4; i++) {
      expect(contents.contents[i].footer.contents[0].action.label).toBe('開く');
    }

    // 最後は「さらに見る」バブル
    const seeMoreBubble = contents.contents[4];
    expect(seeMoreBubble.body.contents[1].text).toContain('3件');
    expect(seeMoreBubble.footer.contents[0].action.label).toBe(
      'すべての結果を見る'
    );
  });

  it('「さらに見る」バブルのURLにsearchクエリが含まれる', () => {
    const links = Array.from({ length: 5 }, (_, i) =>
      createMockLink({ name: `場所${i + 1}` })
    );

    const result = buildSearchResultMessage(links, '渋谷 カフェ');

    const contents = (result as any).contents;
    const seeMoreBubble = contents.contents[contents.contents.length - 1];
    const uri = seeMoreBubble.footer.contents[0].action.uri;

    expect(uri).toContain('liff.line.me/2005710452-e6m8Ao66');
    expect(uri).toContain(
      `search=${encodeURIComponent('渋谷 カフェ')}`
    );
  });

  it('ちょうど5件の場合は残件数が1件と表示される', () => {
    const links = Array.from({ length: 5 }, (_, i) =>
      createMockLink({ name: `場所${i + 1}` })
    );

    const result = buildSearchResultMessage(links, 'カフェ');

    const contents = (result as any).contents;
    const seeMoreBubble = contents.contents[4];
    expect(seeMoreBubble.body.contents[1].text).toContain('1件');
  });

  it('altTextに検索クエリと件数が含まれる', () => {
    const links = Array.from({ length: 3 }, (_, i) =>
      createMockLink({ name: `場所${i + 1}` })
    );

    const result = buildSearchResultMessage(links, 'ラーメン');

    expect((result as any).altText).toBe('「ラーメン」の検索結果: 3件');
  });
});
