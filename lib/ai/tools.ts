import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../init/firebase';
import { Link } from '@/types/Link';

type SearchContext = {
  userId: string;
  groupId?: string;
};

function docsToLinks(snapshot: { docs: { id: string; data: () => Record<string, unknown> }[] }): Link[] {
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      docId: doc.id,
      categories: data.categories || [],
      tags: data.tags || [],
    } as Link;
  });
}

export async function fetchUserLinks(ctx: SearchContext): Promise<Link[]> {
  const linksRef = collection(db, 'Links');

  // グループチャットでもユーザーの全リンクを検索対象にする
  const [memberSnapshot, userSnapshot] = await Promise.all([
    getDocs(query(linksRef, where('members', 'array-contains', ctx.userId))),
    getDocs(query(linksRef, where('userId', '==', ctx.userId))),
  ]);

  const linkMap = new Map<string, Link>();
  for (const link of docsToLinks(memberSnapshot)) {
    linkMap.set(link.docId, link);
  }
  for (const link of docsToLinks(userSnapshot)) {
    linkMap.set(link.docId, link);
  }
  return Array.from(linkMap.values());
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
