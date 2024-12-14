import { useEffect, useState } from "react";
import { collection, addDoc, Timestamp, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '../../../lib/init/firebase';
import { useProfile } from "@/hooks/useProfile";
import { Link } from "@/types/Link";

type Collection = {
  title: string;
  uid: string;
  collectionId: string;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  locations?: Link[]
};

export const useCollection = () => {
  const [collectionList, setCollectionList] = useState<Collection[]>([]);
  const { profile } = useProfile();
  useEffect(() => {
    const fetchCollections = async () => {
      if (!profile) {
        return;
      }

      const querySnapshot = await getDocs(collection(db, "collections"));
      const collections: Collection[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        collections.push({
          title: data.title,
          uid: data.uid,
          collectionId: doc.id,
          isPublic: data.isPublic,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setCollectionList(collections);
    };

    fetchCollections();
  }, [profile]);

  const createCollection = async ({ title, isPublic }: { title: string; isPublic: boolean }): Promise<{
    isOk: boolean;
    message?: string;
  }> => {
   try{
    if (!profile) {
      console.error("ユーザー情報がありません。");
      return {
        isOk: false,
        message: "ユーザー情報がありません。",
      }
    }
    const newCollection = {
      title,
      uid: profile?.userId,
      isPublic,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "collections"), newCollection);
    updateDoc(docRef, {
      collectionId: docRef.id,
    });
    setCollectionList([...collectionList, { ...newCollection, collectionId: docRef.id }]);
    return {
      isOk: true,
    }
   }catch (error) {
    console.error("Error creating collection: ", error);
    return {
      isOk: false,
      message: "コレクションの作成に失敗しました。もう一度お試しください。",
    }
  }
}
const addLocationToCollection = async (collectionId: string, location: string) => {
  try {
    const collectionRef = doc(db, "collections", collectionId);
    const subCollectionRef = collection(collectionRef, "locations");
    await addDoc(subCollectionRef, {
      location,
      createdAt: Timestamp.now(),
    });
    // setCollectionList((prev) =>
    //   prev.map((collection) =>
    //     collection.collectionId === collectionId
    //       ? { ...collection, locations: [...(collection.locations || []), location] }
    //       : collection
    //   )
    // );
  } catch (error) {
    console.error("Error adding location to collection: ", error);
  }
};

  return {
    collectionList,
    createCollection,
    addLocationToCollection,
    deleteCollection: {},
    updateCollection: {},
  };
}
