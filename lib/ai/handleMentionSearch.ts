import { fetchUserLinks } from './tools';
import { filterByKeywords } from '@/lib/search';
import { Link } from '@/types/Link';

export async function handleMentionSearch(
  searchQuery: string,
  userId: string,
  groupId?: string
): Promise<Link[]> {
  const allLinks = await fetchUserLinks({ userId, groupId });

  const filtered = filterByKeywords(allLinks, searchQuery);

  console.log(
    `[handleMentionSearch] query="${searchQuery}", allLinks=${allLinks.length}, matched=${filtered.length}`
  );

  return filtered.slice(0, 10);
}
