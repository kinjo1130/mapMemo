import { openai } from './init/openai';

export interface ImageAnalysisResult {
  placeName: string | null;
  address: string | null;
  area: string | null;
  category: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export async function analyzeImageForPlace(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `あなたは画像から店舗・施設の情報を抽出するアシスタントです。

【最重要ルール】
- 看板・サイン・ロゴに書かれている文字を正確に読み取ってください
- 文字が部分的にしか読めない場合は、読めた部分だけを返してください
- 推測で店舗名を補完・変更しないでください
- 読み取れない文字は無理に埋めないでください

以下のような情報源を認識してください：
- 店舗の看板・外観
- レシート・領収書のヘッダー
- メニュー表
- ビジネスカード・名刺
- 地図アプリやレビューアプリのスクリーンショット
- 店内の装飾やロゴ

必ず以下のJSON形式で応答してください：
{
  "placeName": "店舗名（特定できない場合はnull）",
  "address": "住所（見える場合のみ、なければnull）",
  "area": "エリア・地域名（推定可能な場合、なければnull）",
  "category": "カテゴリ（レストラン、カフェ、居酒屋など、なければnull）",
  "confidence": "high/medium/low（看板文字がはっきり読める=high、一部読める=medium、推測=low）"
}

日本語の店名がある場合は日本語を優先してください。
特定できない場合はすべてnullを返してください。`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'この画像から店舗・施設の情報を抽出してください。',
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { placeName: null, address: null, area: null, category: null, confidence: 'low' };
  }

  try {
    const parsed = JSON.parse(content) as ImageAnalysisResult;
    return {
      placeName: parsed.placeName || null,
      address: parsed.address || null,
      area: parsed.area || null,
      category: parsed.category || null,
      confidence: parsed.confidence || 'low',
    };
  } catch {
    console.error('Failed to parse OpenAI response:', content);
    return { placeName: null, address: null, area: null, category: null, confidence: 'low' };
  }
}
