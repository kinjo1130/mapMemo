import React, { useState, useEffect, useCallback, useRef } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Grid, List, MapPin, Trash2, MessageCircle, Users } from "lucide-react";
import Toast from "./Toast";
import { Link } from "@/types/Link";
import { db } from "@/lib/init/firebase";

interface User {
  displayName: string;
  pictureUrl: string;
}

interface Group {
  groupName: string;
  pictureUrl: string;
}

interface LinkListProps {
  links: Link[];
  onDelete: (id: string) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

const LinkList: React.FC<LinkListProps> = ({
  links,
  onDelete,
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const [columns, setColumns] = useState<1 | 2 | 3>(1);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [groups, setGroups] = useState<Record<string, Group>>({});
  const observer = useRef<IntersectionObserver | null>(null);

  const lastLinkElementRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            onLoadMore();
          }
        },
        { threshold: 1.0 }
      );
      if (node) observer.current.observe(node);
    },
    [hasMore, onLoadMore, isLoading]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const fetchUsersAndGroups = async () => {
      const userIds = links.reduce((acc, link) => {
        if (!acc.includes(link.userId)) {
          acc.push(link.userId);
        }
        return acc;
      }, [] as string[]);

      const groupIds = links.reduce((acc, link) => {
        if (link.groupId && !acc.includes(link.groupId)) {
          acc.push(link.groupId);
        }
        return acc;
      }, [] as string[]);

      const userPromises = userIds.map(async (userId) => {
        const userDoc = await getDoc(doc(db, "users", userId));
        return { userId, userData: userDoc.data() as User };
      });

      const groupPromises = groupIds.map(async (groupId) => {
        const groupDoc = await getDoc(doc(db, "Groups", groupId));
        return { groupId, groupData: groupDoc.data() as Group };
      });

      const userResults = await Promise.all(userPromises);
      const groupResults = await Promise.all(groupPromises);

      setUsers(
        Object.fromEntries(
          userResults.map(({ userId, userData }) => [userId, userData])
        )
      );
      setGroups(
        Object.fromEntries(
          groupResults.map(({ groupId, groupData }) => [groupId, groupData])
        )
      );
    };

    fetchUsersAndGroups();
  }, [links]);

  const layoutOptions = [
    { cols: 1, icon: <List size={24} /> },
    { cols: 2, icon: <Grid size={24} /> },
    { cols: 3, icon: <Grid size={24} /> },
  ] as const;

  const getGridStyle = (): React.CSSProperties => {
    return {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: "1rem",
    };
  };

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await onDelete(id);
        setToast({ message: "リンクが正常に削除されました", type: "success" });
      } catch (err) {
        console.error("Delete error:", err);
        setToast({
          message: "リンクの削除中にエラーが発生しました",
          type: "error",
        });
      }
    },
    [onDelete]
  );

  if (links.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-white shadow rounded-lg p-8">
          <MessageCircle size={64} className="mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold text-neutral-dark mb-2">
            リンクがまだありません
          </h2>
          <p className="text-neutral">
            ボットにGoogle
            Mapのリンクを送って、お気に入り場所のリンクを登録してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-end space-x-2">
        {layoutOptions.map((option) => (
          <button
            key={option.cols}
            onClick={() => setColumns(option.cols)}
            className={`p-2 rounded ${
              columns === option.cols
                ? "bg-primary text-white"
                : "bg-neutral-light text-neutral-dark hover:bg-neutral"
            }`}
            aria-label={`${option.cols}列表示に切り替え`}
          >
            {option.icon}
          </button>
        ))}
      </div>

      <ul style={getGridStyle()} className="sm:grid-cols-1">
        {links.map((link, index) => (
          <li
            key={`${link.docId}-${index}`}
            ref={index === links.length - 1 ? lastLinkElementRef : null}
            className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex h-42">
              <div className="w-1/3 relative">
                <div className="absolute inset-0 bg-neutral-light">
                  <img
                    src={link.photoUrl || "/api/placeholder/150/150"}
                    alt={link.name || "場所の画像"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-2/3 p-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-neutral-dark">
                    {link.name}
                  </h3>
                  <p className="text-xs text-neutral mb-2 line-clamp-1">
                    {link.address}
                  </p>
                  <a
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-dark flex items-center mb-2 underline"
                  >
                    <MapPin size={16} className="mr-2 flex-shrink-0" />
                    <span>Google Map</span>
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 space-y-2 sm:space-y-0">
                  <div className="flex items-center">
                    {users[link.userId] && (
                      <div className="flex items-center mr-4">
                        <img
                          src={users[link.userId].pictureUrl}
                          alt={users[link.userId].displayName}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <span className="text-xs text-neutral-dark">
                          {users[link.userId].displayName}
                        </span>
                      </div>
                    )}
                    {groups[link.groupId] && (
                      <div className="flex items-center">
                        {groups[link.groupId].pictureUrl ? (
                          <img
                            src={groups[link.groupId].pictureUrl}
                            alt={groups[link.groupId].groupName}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        ) : (
                          <Users size={16} className="mr-2 flex-shrink-0" />
                        )}
                        <span className="text-xs text-neutral-dark">
                          {groups[link.groupId].groupName}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(link.docId)}
                    className="text-secondary hover:text-secondary-dark flex items-center self-end sm:self-center"
                    aria-label="アイテムを削除"
                  >
                    <Trash2 size={16} className="mr-2 flex-shrink-0" />
                    <span className="text-xs">削除</span>
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {isLoading && <div className="text-center mt-4">読み込み中...</div>}
      {!isLoading && hasMore && (
        <button
          onClick={onLoadMore}
          className="mt-4 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          さらに読み込む
        </button>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default LinkList;
