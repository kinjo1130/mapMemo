import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/init/firebase";
import { initLiff } from "../lib/init/liff";
import { Profile } from "@line/bot-sdk";
import { useLiff } from "@/hooks/useLiff";

interface Link {
  userId: string;
  groupId: string;
  link: string;
  timestamp: { seconds: number; nanoseconds: number };
}

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
    <div>
      <h1>Welcome, {profile.displayName}</h1>
      {/* ログアウト */}
      <button onClick={logout}>Logout</button>

      <ul>
        {links.map((link, index) => (
          <li key={index}>
            Group ID: {link.groupId} -{" "}
            <a href={link.link} target="_blank">
              {link.link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
