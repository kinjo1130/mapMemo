import { Link } from '@/types/Link';
import { PLACE_TYPE_LABELS } from '@/lib/placeTypeLabels';

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
    (!!link.categories && link.categories.some(cat =>
      cat.toLowerCase().includes(lower) ||
      (PLACE_TYPE_LABELS[cat] && PLACE_TYPE_LABELS[cat].includes(lower))
    )) ||
    (!!link.tags && link.tags.some(tag => tag.toLowerCase().includes(lower))) ||
    (!!link.editorialSummary && link.editorialSummary.toLowerCase().includes(lower))
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
 * ランキング付き検索（メンション用）
 * AND一致を優先し、0件ならOR検索にフォールバック。マッチ数の多い順にソート。
 */
export function filterByKeywordsRanked(links: Link[], searchTerm: string): Link[] {
  const terms = parseSearchTerms(searchTerm);
  if (terms.length === 0) return links;

  // AND検索
  const andResults = links.filter(link => terms.every(term => matchesTerm(link, term)));
  if (andResults.length > 0 || terms.length === 1) return andResults;

  // ORフォールバック: マッチ数でスコアリング
  const scored = links
    .map(link => {
      const matchCount = terms.filter(term => matchesTerm(link, term)).length;
      return { link, matchCount };
    })
    .filter(({ matchCount }) => matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  return scored.map(({ link }) => link);
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
