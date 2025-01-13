import { db } from "../../lib/init/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp, getDoc, startAfter, orderBy } from 'firebase/firestore';
import type { Link } from '@/types/Link';
import type { Collection, CollectionWithLinks } from '@/types/Collection';

// コレクションの作成
export const createCollection = async (userId: string, title: string, isPublic: boolean) => {
  const collectionsRef = collection(db, 'collections');
  const newCollectionRef = doc(collectionsRef);
  
  await setDoc(newCollectionRef, {
    title,
    uid: userId,
    isPublic,
    collectionId: newCollectionRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return newCollectionRef.id;
};

// コレクションの取得
export const getCollections = async (userId: string) => {
  const collectionsRef = collection(db, 'collections');
  const q = query(collectionsRef, where('uid', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as Collection;
    return {
      ...data,
      id: doc.id,
    };
  });
};

// コレクションへのリンク追加
export const addLinkToCollection = async (collectionId: string, link: Link) => {
  const linkRef = doc(db, `collections/${collectionId}/links/${link.docId}`);
  
  await setDoc(linkRef, {
    ...link,
    addedAt: serverTimestamp(),
  });
};

// コレクションからリンクを削除
export const removeLinkFromCollection = async (collectionId: string, linkId: string) => {
  // linksサブコレクション内の特定のドキュメントを削除
  const linkRef = doc(db, `collections/${collectionId}/links`, linkId);
  await deleteDoc(linkRef);
};

// リンクがコレクションに含まれているか確認
export const isLinkInCollection = async (collectionId: string, linkId: string) => {
  const linkRef = doc(db, `collections/${collectionId}/links`, linkId);
  const linkDoc = await getDoc(linkRef);
  return linkDoc.exists();
};

// ページネーションなしですべてのリンクを取得する場合の関数
export const getAllCollectionLinks = async (collectionId: string): Promise<Link[]> => {
  try {
    const linksRef = collection(db, `collections/${collectionId}/links`);
    const q = query(linksRef, orderBy('addedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const links: Link[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      links.push({
        docId: doc.id,
        address: data.address,
        groupId: data.groupId,
        link: data.link,
        name: data.name,
        photoUrl: data.photoUrl,
        timestamp: data.timestamp,
        userId: data.userId,
        lat: data.lat,
        lng: data.lng,
        userPictureUrl: data.userPictureUrl,
        displayName: data.displayName,
        groupName: data.groupName,
        groupPictureUrl: data.groupPictureUrl,
        // addedAt: data.addedAt
      });
    });

    return links;

  } catch (error) {
    console.error('Error getting all collection links:', error);
    throw error;
  }
};