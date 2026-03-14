import { tool } from 'ai';
import { z } from 'zod';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../init/firebase';
import { Link } from '@/types/Link';
import { scoreByKeywords } from '@/lib/search';

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

async function fetchUserLinks(ctx: SearchContext): Promise<Link[]> {
  const linksRef = collection(db, 'Links');

  if (ctx.groupId) {
    const q = query(
      linksRef,
      where('members', 'array-contains', ctx.userId),
      where('groupId', '==', ctx.groupId)
    );
    const snapshot = await getDocs(q);
    return docsToLinks(snapshot);
  }

  // or() を使わず2つのクエリを並行実行してマージ（インデックス不要）
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

export function createSearchTools(ctx: SearchContext) {
  // Firestoreクエリを1回だけ実行してキャッシュ
  let cachedLinks: Link[] | null = null;
  async function getLinks(): Promise<Link[]> {
    if (!cachedLinks) {
      cachedLinks = await fetchUserLinks(ctx);
    }
    return cachedLinks;
  }

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
        try {
          const allLinks = await getLinks();
          let scored = allLinks
            .map((link) => ({ link, ...scoreByKeywords(link, keywords) }))
            .filter((item) => item.matches)
            .sort((a, b) => b.score - a.score);

          if (categories && categories.length > 0) {
            scored = scored.filter((item) =>
              item.link.categories?.some((cat) =>
                categories.some((c) => cat.toLowerCase().includes(c.toLowerCase()))
              )
            );
          }

          const results = scored.slice(0, 20);
          console.log(
            `[searchByKeyword] keywords=${JSON.stringify(keywords)}, allLinks=${allLinks.length}, matched=${scored.length}, returning=${results.length}`
          );
          return results.map(({ link }) => ({
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
        } catch (error) {
          console.error('searchByKeyword error:', error);
          return { error: `検索中にエラーが発生しました: ${error}` };
        }
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
          .describe(
            '検索半径（km）。指定した距離以内の地点のみ返します。デフォルト: 50km'
          ),
      }),
      execute: async ({ lat, lng, radiusKm }) => {
        try {
          const radius = radiusKm ?? 50;
          const allLinks = await getLinks();
          const withDistance = allLinks
            .filter((link) => link.lat != null && link.lng != null)
            .map((link) => ({
              link,
              distance: haversineDistance(lat, lng, link.lat!, link.lng!),
            }))
            .filter((item) => item.distance <= radius)
            .sort((a, b) => a.distance - b.distance);

          const results = withDistance.slice(0, 20);
          console.log(
            `[searchByLocation] lat=${lat}, lng=${lng}, allLinks=${allLinks.length}, returning=${results.length}`
          );
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
        } catch (error) {
          console.error('searchByLocation error:', error);
          return { error: `位置検索中にエラーが発生しました: ${error}` };
        }
      },
    }),

    geocode: tool({
      description:
        '地名や場所の名前を座標（緯度・経度）に変換します。「渋谷の近く」「東京駅周辺」などの位置表現を処理する際に使用します。',
      inputSchema: z.object({
        placeName: z.string().describe('座標に変換する地名（例: 渋谷、東京駅、新宿）'),
      }),
      execute: async ({ placeName }) => {
        try {
          const apiKey = process.env.GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
            return { error: 'Google Maps API key is not set' };
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
          console.log(
            `[geocode] placeName="${placeName}" → lat=${location.lat}, lng=${location.lng}`
          );
          return {
            lat: location.lat,
            lng: location.lng,
            formattedAddress: data.results[0].formatted_address,
          };
        } catch (error) {
          console.error('geocode error:', error);
          return { error: `ジオコード中にエラーが発生しました: ${error}` };
        }
      },
    }),
  };
}
