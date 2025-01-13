// utils/date.ts
import { Timestamp } from 'firebase/firestore';

export const formatDate = (timestamp: any): string => {
  if (!timestamp) return '日付なし';

  try {
    // FirestoreのTimestampの場合
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // 数値の場合（Unix timestamp）
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // その他のケース（文字列など）
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    return '日付なし';
  } catch (error) {
    console.error('Date formatting error:', error);
    return '日付なし';
  }
};