// lib/firebase-admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is not defined');
    }

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    if (!clientEmail) {
      throw new Error('FIREBASE_CLIENT_EMAIL is not defined');
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is not defined');
    }

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // privateKeyの改行コードを適切に処理
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      storageBucket: storageBucket,
    });

    
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // スタックトレースも出力
    if (error instanceof Error) {
      console.error(error.stack);
    }
    throw error;
  }
}

const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

export { bucket };