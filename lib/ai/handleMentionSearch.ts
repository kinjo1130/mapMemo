import { generateText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createSearchTools } from './tools';
import { Link } from '@/types/Link';

export async function handleMentionSearch(
  searchQuery: string,
  userId: string,
  groupId?: string
): Promise<Link[]> {
  const tools = createSearchTools({ userId, groupId });

  const { steps } = await generateText({
    model: openai('gpt-4o-mini'),
    tools,
    toolChoice: 'required',
    stopWhen: stepCountIs(3),
    system: `あなたはMapMemoアシスタントです。ユーザーが保存した地点（お気に入りの場所）を検索して最適な結果を返します。

利用可能なツール:
- searchByKeyword: キーワードで保存済み地点を検索
- searchByLocation: 座標で保存済み地点を距離順に検索
- geocode: 地名を座標に変換

検索戦略:
1. 地名を含むクエリ（例: 「大分の店」「渋谷のカフェ」）: まずgeocodeで地名の座標を取得し、searchByLocationで近くの地点を検索。
2. 「カフェ」「ラーメン」などのキーワードのみの場合: searchByKeywordで検索
3. 位置+キーワードの場合: geocode → searchByLocation で位置検索し、キーワードも searchByKeyword で検索して、両方の結果をAIが統合
4. 具体的な条件がない場合: searchByKeyword([]) で全件取得

キーワード抽出のルール:
- 地名（都道府県、市区町村、駅名など）は searchByKeyword のキーワードとしても使用する
- 「店」「場所」「スポット」「所」などの汎用的な語はキーワードに含めない
- 例: 「大分の店」→ searchByKeyword(["大分"]) + geocode("大分") → searchByLocation

必ずツールを呼び出してください。ツール呼び出しなしで応答しないでください。`,
    prompt: searchQuery,
  });

  // デバッグログ: 各ステップのtool呼び出し状況
  for (const step of steps) {
    console.log(
      `[handleMentionSearch] Step: toolCalls=${step.toolCalls.length}, toolResults=${step.toolResults.length}`
    );
    for (const tr of step.toolResults) {
      console.log(
        `  Tool: ${tr.toolName}, output: ${JSON.stringify(tr.output).slice(0, 200)}`
      );
    }
  }

  // ツール結果からLinkデータを直接収集
  const linkMap = new Map<string, Link>();
  for (const step of steps) {
    if (step.toolResults) {
      for (const toolResult of step.toolResults) {
        const output = toolResult.output as unknown;
        if (Array.isArray(output)) {
          for (const item of output) {
            if (item && typeof item === 'object' && 'docId' in item) {
              const linkData = item as Link;
              if (!linkMap.has(linkData.docId)) {
                linkMap.set(linkData.docId, linkData);
              }
            }
          }
        }
      }
    }
  }

  console.log(`[handleMentionSearch] collected ${linkMap.size} unique links`);

  return Array.from(linkMap.values()).slice(0, 10);
}
