import { useState, useEffect } from 'react';
import { initLiff } from "../lib/init/liff";
import { Profile } from "@line/bot-sdk";

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userProfile = await initLiff();
        setProfile(userProfile);
      } catch (error) {
        console.error("Error initializing LIFF:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return { profile, loading };
};