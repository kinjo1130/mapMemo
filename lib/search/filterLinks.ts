import { Link } from '@/types/Link';

/**
 * 検索キーワードを分割（半角・全角スペース対応）
 */
export function parseSearchTerms(searchTerm: string): string[] {
  return searchTerm.toLowerCase().split(/\s+|\u3000+/).filter(term => term.length > 0);
}

/**
 * 1つのキーワードがlinkの各フィールドにマッチするか
 */
export function matchesTerm(link: Link, term: string): boolean {
  const lower = term.toLowerCase();
  return (
    (!!link.name && link.name.toLowerCase().includes(lower)) ||
    (!!link.address && link.address.toLowerCase().includes(lower)) ||
    (!!link.groupName && link.groupName.toLowerCase().includes(lower)) ||
    (!!link.displayName && link.displayName.toLowerCase().includes(lower)) ||
    (!!link.categories && link.categories.some(cat => cat.toLowerCase().includes(lower))) ||
    (!!link.tags && link.tags.some(tag => tag.toLowerCase().includes(lower)))
  );
}

/**
 * AND検索（Web UI用）- 全キーワードにマッチするリンクのみ返す
 */
export function filterByKeywords(links: Link[], searchTerm: string): Link[] {
  const terms = parseSearchTerms(searchTerm);
  if (terms.length === 0) return links;
  return links.filter(link => terms.every(term => matchesTerm(link, term)));
}

/**
 * スコア付きマッチング（AI検索用）- 1つでもマッチすればtrue、スコアで順位付け
 */
export function scoreByKeywords(link: Link, keywords: string[]): { matches: boolean; score: number } {
  if (keywords.length === 0) return { matches: true, score: 1 };

  let matchCount = 0;
  for (const term of keywords) {
    if (matchesTerm(link, term)) matchCount++;
  }

  return { matches: matchCount > 0, score: matchCount / keywords.length };
}

/**
 * 日付範囲フィルタ
 */
export function filterByDateRange(links: Link[], startDate: Date | null, endDate: Date | null): Link[] {
  if (!startDate && !endDate) return links;

  return links.filter(link => {
    if (!link.timestamp) return false;

    const linkDate = link.timestamp.toDate();
    linkDate.setHours(0, 0, 0, 0);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return linkDate >= start && linkDate <= end;
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      return linkDate >= start;
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return linkDate <= end;
    }
    return true;
  });
}

/**
 * ソート
 */
export function sortLinks(links: Link[], sortOrder: 'saved' | 'name'): Link[] {
  return [...links].sort((a, b) => {
    if (sortOrder === 'name') {
      return (a.name || '').localeCompare(b.name || '', 'ja');
    }
    return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
  });
}
