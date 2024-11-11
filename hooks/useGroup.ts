import { getGroupInfo } from "@/lib/Group/getGroupInfo";
import { Group } from "@/types/group";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "../lib/init/firebase";

export const useGroup = (userId: string) => {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  useEffect(() => {
    const getAllGroups = async (userId: string) => {
      setIsLoading(true);
      try {
        const groupCollection = collection(db, "Groups");
        const q = query(groupCollection, where("members", "array-contains", userId));
        const groupSnapshot = await getDocs(q);
        setGroups(groupSnapshot.docs.map((doc) => doc.data() as Group));
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    getAllGroups(userId);
  }, [userId]);
  const handleSelectGroup = useCallback((groupId: string) => {
    setSelectedGroup(groups?.find((group) => group.groupId === groupId) ?? null);
  }, [groups]);

  return { groups, selectedGroup,handleSelectGroup, isLoading, error };
}