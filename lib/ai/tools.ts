import { tool } from 'ai';
import { z } from 'zod';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from '../init/firebase';
import { Link } from '@/types/Link';

type SearchContext = {
  userId: string;
  groupId?: string;
};

async function fetchUserLinks(ctx: SearchContext): Promise<Link[]> {
  const linksRef = collection(db, 'Links');

  const q = ctx.groupId
    ? query(
        linksRef,
        where('members', 'array-contains', ctx.userId),
        where('groupId', '==', ctx.groupId)
      )
    : query(
        linksRef,
        or(
          where('members', 'array-contains', ctx.userId),
          where('userId', '==', ctx.userId)
        )
      );

  const snapshot = await getDocs(q);
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

function matchesKeywords(link: Link, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  return keywords.every((term) => {
    const lower = term.toLowerCase();
    return (
      (link.name && link.name.toLowerCase().includes(lower)) ||
      (link.address && link.address.toLowerCase().includes(lower)) ||
      (link.groupName && link.groupName.toLowerCase().includes(lower)) ||
      (link.displayName && link.displayName.toLowerCase().includes(lower)) ||
      (link.categories &&
        link.categories.some((cat) => cat.toLowerCase().includes(lower))) ||
      (link.tags &&
        link.tags.some((tag) => tag.toLowerCase().includes(lower)))
    );
  });
}

function haversineDistance(
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

export function createSearchTools(ctx: SearchContext) {
  return {
    searchByKeyword: tool({
      description:
        'ユーザーの保存済み地点をキーワードで検索します。名前、住所、タグ、カテゴリ、グループ名、保存者名で検索できます。',
      inputSchema: z.object({
        keywords: z
          .array(z.string())
          .describe('検索キーワードの配列。全てのキーワードにマッチする結果を返します。'),
        categories: z
          .array(z.string())
          .optional()
          .describe('フィルタするカテゴリ（例: restaurant, cafe）'),
      }),
      execute: async ({ keywords, categories }) => {
        const allLinks = await fetchUserLinks(ctx);
        let filtered = allLinks.filter((link) => matchesKeywords(link, keywords));

        if (categories && categories.length > 0) {
          filtered = filtered.filter((link) =>
            link.categories?.some((cat) =>
              categories.some((c) => cat.toLowerCase().includes(c.toLowerCase()))
            )
          );
        }

        const results = filtered.slice(0, 20);
        return results.map((link) => ({
          docId: link.docId,
          name: link.name,
          address: link.address,
          lat: link.lat,
          lng: link.lng,
          rating: link.rating ?? null,
          categories: link.categories,
          tags: link.tags,
          googleMapsUrl: link.googleMapsUrl || link.link,
          photoUrl: link.photoUrl,
        }));
      },
    }),

    searchByLocation: tool({
      description:
        '指定された座標の近くにある保存済み地点を検索します。結果は距離順でソートされます。',
      inputSchema: z.object({
        lat: z.number().describe('緯度'),
        lng: z.number().describe('経度'),
        radiusKm: z
          .number()
          .optional()
          .default(3)
          .describe('検索半径（km）。デフォルトは3km。'),
      }),
      execute: async ({ lat, lng, radiusKm }) => {
        const allLinks = await fetchUserLinks(ctx);
        const radius = radiusKm ?? 3;

        const withDistance = allLinks
          .filter((link) => link.lat != null && link.lng != null)
          .map((link) => ({
            link,
            distance: haversineDistance(lat, lng, link.lat!, link.lng!),
          }))
          .filter((item) => item.distance <= radius)
          .sort((a, b) => a.distance - b.distance);

        const results = withDistance.slice(0, 20);
        return results.map(({ link, distance }) => ({
          docId: link.docId,
          name: link.name,
          address: link.address,
          lat: link.lat,
          lng: link.lng,
          distanceKm: Math.round(distance * 100) / 100,
          rating: link.rating ?? null,
          categories: link.categories,
          tags: link.tags,
          googleMapsUrl: link.googleMapsUrl || link.link,
          photoUrl: link.photoUrl,
        }));
      },
    }),

    geocode: tool({
      description:
        '地名や場所の名前を座標（緯度・経度）に変換します。「渋谷の近く」「東京駅周辺」などの位置表現を処理する際に使用します。',
      inputSchema: z.object({
        placeName: z.string().describe('座標に変換する地名（例: 渋谷、東京駅、新宿）'),
      }),
      execute: async ({ placeName }) => {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key is not set');
        }

        const url = 'https://maps.googleapis.com/maps/api/geocode/json';
        const params = new URLSearchParams({
          address: placeName,
          key: apiKey,
          language: 'ja',
        });

        const response = await fetch(`${url}?${params}`);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results?.length) {
          return { error: `「${placeName}」の座標を取得できませんでした。` };
        }

        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: data.results[0].formatted_address,
        };
      },
    }),
  };
}
