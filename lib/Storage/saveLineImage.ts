import { bucket } from '../init/firebase-admin';
import { client } from '../init/line';

/**
 * LINE メッセージから画像を取得し、Firebase Storage に保存する
 */
export async function saveLineImageToStorage(
  messageId: string,
  userId: string
): Promise<string> {
  // LINE APIから画像コンテンツを取得
  const stream = await client.getMessageContent(messageId);

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);

  const fileName = `images/${userId}/${Date.now()}_${messageId}.jpg`;
  const file = bucket.file(fileName);

  const metadata = {
    contentType: 'image/jpeg',
    metadata: {
      userId,
      messageId,
      timestamp: Date.now().toString(),
    },
  };

  await file.save(buffer, { metadata });
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  return publicUrl;
}
