import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/init/firebase";
import { initLiff } from "../lib/init/liff";
import { Profile } from "@line/bot-sdk";
import { useLiff } from "@/hooks/useLiff";
import LinkList from "@/components/LinkList";
import { Link } from "@/types/Link";
import Header from "@/components/Header";


export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const { logout } = useLiff();

  useEffect(() => {
    const initialize = async () => {
      try {
        const userProfile = await initLiff();
        setProfile(userProfile);
        loadLinks(userProfile.userId);
      } catch (error) {
        console.error("Error initializing LIFF:", error);
      }
    };

    initialize();
  }, []);

  const loadLinks = async (userId: string) => {
    try {
      const q = query(collection(db, "Links"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const linksData = querySnapshot.docs.map((doc) => doc.data() as Link);
      console.log("Links loaded:", linksData);
      setLinks(linksData);
    } catch (error) {
      console.error("Error loading links:", error);
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header profile={profile} logout={logout} />
      <main className="container mx-auto p-4">
        <LinkList links={links} />
      </main>
    </div>
  );
}
