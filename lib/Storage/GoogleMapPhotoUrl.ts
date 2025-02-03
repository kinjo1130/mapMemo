import { bucket } from '../../lib/init/firebase-admin';
import fetch from 'node-fetch';


export async function fetchAndSaveToFirestore(
  placeId: string,
  photoReference: string,
  apiKey: string
): Promise<string> {
  try {
    // Google Places APIから画像を取得
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
    const response = await fetch(photoUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const fileName = `places/${placeId}/${Date.now()}.jpg`;
    const file = bucket.file(fileName);

    // メタデータ設定
    const metadata = {
      contentType: 'image/jpeg',
      metadata: {
        placeId: placeId,
        timestamp: Date.now().toString()
      }
    };

    // アップロード
    await file.save(Buffer.from(buffer), {
      metadata: metadata
    });

    // 公開URLの生成
    await file.makePublic();  // ファイルを公開設定に
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return publicUrl;
  } catch (error) {
    // console.error('Error in fetchAndSaveToFirestore:', error);
    throw error;
  }
}