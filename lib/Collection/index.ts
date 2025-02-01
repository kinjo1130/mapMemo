import { db } from "../../lib/init/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp, getDoc, startAfter, orderBy, updateDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import type { Link } from '@/types/Link';
import type { Collection, CollectionUser, CollectionWithLinks } from '@/types/Collection';
import { getCurrentUser } from "../User/getCurrentUser";

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

  // 所有しているコレクションとユーザーが参加しているコレクションの両方を取得
  const q = query(
    collectionsRef,
    where('uid', '==', userId)
  );
  const q2 = query(
    collectionsRef,
    where('userIds', 'array-contains', userId)
  );

  const [ownedSnapshot, participatingSnapshot] = await Promise.all([
    getDocs(q),
    getDocs(q2)
  ]);

  // 両方の結果を結合して重複を除去
  const collections = new Map();

  [...ownedSnapshot.docs, ...participatingSnapshot.docs].forEach(doc => {
    if (!collections.has(doc.id)) {
      const data = doc.data() as Collection;
      collections.set(doc.id, {
        ...data,
        id: doc.id,
      });
    }
  });

  return Array.from(collections.values());
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
  const isDev = process.env.NODE_ENV === 'development';
  const baseUrl = isDev ? process.env.NEXT_PUBLIC_LIFF_URL_DEV : process.env.NEXT_PUBLIC_LIFF_URL_PROD;
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

  // ユーザーを追加する関数
  const userProfile = await getCurrentUser(userId);
  if (!userProfile) {
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  await updateDoc(collectionRef, {
    // 追加情報つきユーザー配列にアトミック追加
    users: arrayUnion({
      uid: userId,
      role,
      addedAt: Timestamp.now(),
      displayName: userProfile.displayName,
      pictureUrl: userProfile.pictureUrl,
      statusMessage: userProfile.statusMessage
    }),

    // ユーザーIDだけをまとめた配列にアトミック追加
    userIds: arrayUnion(userId),

    // 更新日時
    updatedAt: Timestamp.now(),
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