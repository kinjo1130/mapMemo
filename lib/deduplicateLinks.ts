import type { Link } from '@/types/Link';

/**
 * docId で重複する Link を排除し、最初に出現したものを残す
 */
export function deduplicateLinks(links: Link[]): Link[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.docId)) return false;
    seen.add(link.docId);
    return true;
  });
}
