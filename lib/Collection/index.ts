import { db } from "../../lib/init/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp, getDoc, startAfter, orderBy, updateDoc } from 'firebase/firestore';
import type { Link } from '@/types/Link';
import type { Collection, CollectionUser, CollectionWithLinks } from '@/types/Collection';

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

// コレクションの共有状態を更新
export const updateCollectionShare = async (collectionId: string, isPublic: boolean) => {
  const collectionRef = doc(db, `collections/${collectionId}`);
  await updateDoc(collectionRef, {
    isPublic,
    updatedAt: serverTimestamp()
  });
};

// 共有コレクションの取得
export const getSharedCollection = async (collectionId: string) => {
  const collectionRef = doc(db, `collections/${collectionId}`);
  const collectionSnap = await getDoc(collectionRef);

  if (!collectionSnap.exists()) {
    throw new Error('Collection not found');
  }

  const collection = collectionSnap.data() as Collection;
  
  if (!collection.isPublic) {
    throw new Error('This collection is private');
  }

  return collection;
};

// 共有URLの生成
export const generateShareURL = (collectionId: string) => {
  // 現在のホストURLを取得
  const baseUrl = window.location.origin;
  return `${baseUrl}/collections/share/${collectionId}`;
};
// lib/Collection.ts

// ユーザーをコレクションに追加
export const addUserToCollection = async (
  collectionId: string,
  userId: string,
  role: 'editor' | 'viewer' = 'viewer'
) => {
  const collectionRef = doc(db, `collections/${collectionId}`);
  const collectionDoc = await getDoc(collectionRef);
  
  if (!collectionDoc.exists()) {
    throw new Error('Collection not found');
  }

  const collection = collectionDoc.data();
  const users = collection.users || [];
  
  // すでに追加されているユーザーはスキップ
  if (users.some((user: CollectionUser) => user.uid === userId)) {
    return;
  }

  await updateDoc(collectionRef, {
    users: [...users, {
      uid: userId,
      role,
      addedAt: serverTimestamp()
    }],
    updatedAt: serverTimestamp()
  });
};

// コレクションのコピーを作成
export const copyCollection = async (
  sourceCollectionId: string,
  userId: string,
  newTitle?: string
) => {
  // 元のコレクション情報を取得
  const sourceCollectionRef = doc(db, `collections/${sourceCollectionId}`);
  const sourceCollectionDoc = await getDoc(sourceCollectionRef);
  
  if (!sourceCollectionDoc.exists()) {
    throw new Error('Source collection not found');
  }

  // 新しいコレクションを作成
  const title = newTitle || `${sourceCollectionDoc.data().title} (コピー)`;
  const newCollectionId = await createCollection(userId, title, false);

  // リンクをコピー
  const sourceLinks = await getAllCollectionLinks(sourceCollectionId);
  const copyPromises = sourceLinks.map(link => 
    addLinkToCollection(newCollectionId, link)
  );
  
  await Promise.all(copyPromises);
  
  return newCollectionId;
};

// コレクションのユーザー権限を更新
export const updateUserRole = async (
  collectionId: string,
  userId: string,
  newRole: 'editor' | 'viewer'
) => {
  const collectionRef = doc(db, `collections/${collectionId}`);
  const collectionDoc = await getDoc(collectionRef);
  
  if (!collectionDoc.exists()) {
    throw new Error('Collection not found');
  }

  const collection = collectionDoc.data();
  const users = collection.users || [];
  
  const updatedUsers = users.map((user: CollectionUser) => 
    user.uid === userId ? { ...user, role: newRole } : user
  );

  await updateDoc(collectionRef, {
    users: updatedUsers,
    updatedAt: serverTimestamp()
  });
};

// コレクションからユーザーを削除
export const removeUserFromCollection = async (
  collectionId: string,
  userId: string
) => {
  const collectionRef = doc(db, `collections/${collectionId}`);
  const collectionDoc = await getDoc(collectionRef);
  
  if (!collectionDoc.exists()) {
    throw new Error('Collection not found');
  }

  const collection = collectionDoc.data();
  const users = collection.users || [];
  
  const updatedUsers = users.filter((user: CollectionUser) => user.uid !== userId);

  await updateDoc(collectionRef, {
    users: updatedUsers,
    updatedAt: serverTimestamp()
  });
};

// コレクションを取得
export const getCollectionById = async (collectionId: string) => {
  const collectionRef = doc(db, `collections/${collectionId}`);
  const collectionDoc = await getDoc(collectionRef);
  
  if (!collectionDoc.exists()) {
    return null;
  }

  const data = collectionDoc.data();
  return {
    ...data,
    collectionId: collectionDoc.id
  } as Collection;
};