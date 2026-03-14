import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, limit, or, orderBy, OrderByDirection } from "firebase/firestore";
import { db } from "../lib/init/firebase";
import { Link } from "@/types/Link";

export const BASE_QUERY =({
  userId,
  orderByField,
  orderDirection
}:{
  userId: string;
  orderByField: string;
  orderDirection: OrderByDirection;
}) =>{
   return query(
  collection(db, "Links"),
  or(
    where("members", "array-contains", userId),
    where("userId", "==", userId)
  ),
  orderBy(orderByField, orderDirection),
);
}


export const useLinks = (linksPerPage: number) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // TODO: ソート機能を追加する
  const [orderByField, setOrderByField] = useState("timestamp");
  const [orderDirection, setOrderDirection] = useState<OrderByDirection>("desc");

  const loadLinks = useCallback(async (userId: string, lastDoc: any = null) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      let q = BASE_QUERY({ userId, orderByField, orderDirection });

      const querySnapshot = await getDocs(q);
      const newLinks = querySnapshot.docs.map(
        (doc) => {
          const data = doc.data();
          return { ...data, docId: doc.id, categories: data.categories || [], tags: data.tags || [] } as Link;
        }
      );

      setLinks((prevLinks) => {
        const uniqueNewLinks = newLinks.filter(
          (newLink) => !prevLinks.some((prevLink) => prevLink.docId === newLink.docId)
        );
        return [...prevLinks, ...uniqueNewLinks];
      });

      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      setHasMore(querySnapshot.docs.length === linksPerPage);
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setIsLoading(false);
    }
  }, [linksPerPage]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadLinks(links[0]?.userId, lastVisible);
    }
  }, [hasMore, isLoading, lastVisible, loadLinks, links]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "Links", id));
      setLinks((prevLinks) => prevLinks.filter((link) => link.docId !== id));
    } catch (error) {
      console.error("Error deleting link:", error);
      throw error;
    }
  }, []);

  // 自分が所属しているグループごとにフィリタリングできるようにする
  const searchLinksByGroup = useCallback(async (userId: string, groupId: string) => {
    setIsLoading(true);
    try {
      const linksRef = collection(db, 'Links');

      const baseQuery = groupId !== ""
      ? query(
          linksRef,
          where("members", "array-contains", userId),
          where("groupId", "==", groupId),
          limit(100)
        )
      : BASE_QUERY({ userId, orderByField, orderDirection });

      const querySnapshot = await getDocs(baseQuery);
      const allLinks: Link[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allLinks.push({ ...data, docId: doc.id, categories: data.categories || [], tags: data.tags || [] } as Link);
      });

      const filteredLinks = allLinks.filter(link => {
        return link.groupId === groupId;
      });

      setLinks(filteredLinks.slice(0, linksPerPage));
      setHasMore(filteredLinks.length > linksPerPage);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error searching links:', error);
    } finally {
      setIsLoading(false);
    }
  }, [linksPerPage]);

  const handleTagsUpdated = useCallback((docId: string, tags: string[]) => {
    setLinks((prevLinks) =>
      prevLinks.map((link) => link.docId === docId ? { ...link, tags } : link)
    );
  }, []);

  return { links, hasMore, isLoading, loadLinks, handleLoadMore, handleDelete, searchLinksByGroup, handleTagsUpdated };

};