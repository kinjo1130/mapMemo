import { generateText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createSearchTools } from './tools';
import { Link } from '@/types/Link';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from '../init/firebase';

export async function handleMentionSearch(
  searchQuery: string,
  userId: string,
  groupId?: string
): Promise<Link[]> {
  const tools = createSearchTools({ userId, groupId });

  const { steps } = await generateText({
    model: openai('gpt-4o-mini'),
    tools,
    stopWhen: stepCountIs(3),
    system: `あなたはMapMemoアシスタントです。ユーザーが保存した地点（お気に入りの場所）を検索して最適な結果を返します。

利用可能なツール:
- searchByKeyword: キーワードで保存済み地点を検索
- searchByLocation: 座標と半径で近くの保存済み地点を検索
- geocode: 地名を座標に変換

検索戦略:
1. 「渋谷の近く」「東京駅周辺」などの位置表現がある場合: まずgeocodeで座標を取得し、searchByLocationで近くの地点を検索
2. 「カフェ」「ラーメン」などのキーワードがある場合: searchByKeywordで検索
3. 位置+キーワードの場合: geocode → searchByLocation で位置検索し、キーワードも searchByKeyword で検索して、両方の結果をAIが統合
4. 具体的な条件がない場合: searchByKeyword([]) で全件取得

必ずツールを呼び出してください。ツール呼び出しなしで応答しないでください。`,
    prompt: searchQuery,
  });

  // ツール結果からdocIdを収集
  const docIds = new Set<string>();
  for (const step of steps) {
    if (step.toolResults) {
      for (const toolResult of step.toolResults) {
        const output = toolResult.output as unknown;
        if (Array.isArray(output)) {
          for (const item of output) {
            if (item && typeof item === 'object' && 'docId' in item) {
              docIds.add((item as { docId: string }).docId);
            }
          }
        }
      }
    }
  }

  if (docIds.size === 0) {
    return [];
  }

  // docIdから実際のLinkオブジェクトを取得
  const linksRef = collection(db, 'Links');
  const q = groupId
    ? query(
        linksRef,
        where('members', 'array-contains', userId),
        where('groupId', '==', groupId)
      )
    : query(
        linksRef,
        or(
          where('members', 'array-contains', userId),
          where('userId', '==', userId)
        )
      );

  const snapshot = await getDocs(q);
  const links: Link[] = [];
  snapshot.forEach((doc) => {
    if (docIds.has(doc.id)) {
      const data = doc.data();
      links.push({
        ...data,
        docId: doc.id,
        categories: data.categories || [],
        tags: data.tags || [],
      } as Link);
    }
  });

  // ツール結果の順序を保持
  const orderedDocIds = Array.from(docIds);
  links.sort(
    (a, b) => orderedDocIds.indexOf(a.docId) - orderedDocIds.indexOf(b.docId)
  );

  return links.slice(0, 10);
}
