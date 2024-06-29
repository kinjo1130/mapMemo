import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, limit, startAfter } from "firebase/firestore";
import { db } from "../lib/init/firebase";
import { Link } from "@/types/Link";

export const useLinks = (linksPerPage: number) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadLinks = useCallback(async (userId: string, lastDoc: any = null) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      let q = query(
        collection(db, "Links"),
        where("userId", "==", userId),
        limit(linksPerPage)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const newLinks = querySnapshot.docs.map(
        (doc) => ({ ...doc.data(), docId: doc.id } as Link)
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

  return { links, hasMore, isLoading, loadLinks, handleLoadMore, handleDelete };
};