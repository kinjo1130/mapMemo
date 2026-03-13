import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/init/firebase';

export const updateLinkTags = async (docId: string, tags: string[]): Promise<void> => {
  const linkRef = doc(db, 'Links', docId);
  await updateDoc(linkRef, { tags });
};
