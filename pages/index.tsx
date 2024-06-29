import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../lib/init/firebase";
import { initLiff } from "../lib/init/liff";
import { Profile } from "@line/bot-sdk";
import { useLiff } from "@/hooks/useLiff";
import LinkList from "@/components/LinkList";
import { Link } from "@/types/Link";
import Header from "@/components/Header";

const LINKS_PER_PAGE = 5;

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useLiff();

  const loadLinks = useCallback(async (userId: string, lastDoc: any = null) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      let q = query(
        collection(db, "Links"),
        where("userId", "==", userId),
        limit(LINKS_PER_PAGE)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const newLinks = querySnapshot.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            docId: doc.id,
          } as Link)
      );

      setLinks((prevLinks) => {
        const uniqueNewLinks = newLinks.filter(
          (newLink) =>
            !prevLinks.some((prevLink) => prevLink.docId === newLink.docId)
        );
        return [...prevLinks, ...uniqueNewLinks];
      });

      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      setHasMore(querySnapshot.docs.length === LINKS_PER_PAGE);
      console.log("Loaded links:", newLinks);
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userProfile = await initLiff();
        setProfile(userProfile);
        await loadLinks(userProfile.userId);
      } catch (error) {
        console.error("Error initializing LIFF:", error);
      }
    };

    initialize();
  }, [loadLinks]);

  const handleLoadMore = useCallback(() => {
    if (profile && hasMore && !isLoading) {
      loadLinks(profile.userId, lastVisible);
    }
  }, [profile, hasMore, isLoading, lastVisible, loadLinks]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "Links", id));
      setLinks((prevLinks) => prevLinks.filter((link) => link.docId !== id));
    } catch (error) {
      console.error("Error deleting link:", error);
      throw error;
    }
  }, []);

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header profile={profile} logout={logout} />
      <main className="container mx-auto p-4">
        <LinkList
          links={links}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
