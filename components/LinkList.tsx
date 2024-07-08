import React, { useState, useEffect, useCallback, useRef } from "react";
import { Grid, List, MapPin, Trash2, MessageCircle, Users } from "lucide-react";
import Toast from "./Toast";
import { Link } from "@/types/Link";

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
      const userConfirmed = window.confirm(
        "本当にこのリンクを削除してもよろしいですか？"
      );
      if (!userConfirmed) return;

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
                    className="text-link hover:text-link-dark flex items-center mb-2 underline"
                  >
                    <MapPin size={16} className="mr-2 flex-shrink-0" />
                    <span>Google Map</span>
                  </a>
                  <div className="flex items-center mt-2">
                    {link.userPictureUrl && (
                      <img
                        src={link.userPictureUrl}
                        alt={link.displayName}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    )}
                    <span className="text-sm text-neutral-dark">
                      {link.displayName}
                    </span>
                  </div>
                  {link.groupId && (
                    <div className="flex items-center mt-2">
                      {link.groupPictureUrl && (
                        <img
                          src={link.groupPictureUrl}
                          alt={link.groupName}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      <span className="text-sm text-neutral-dark">
                        {link.groupName}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mt-2 space-y-2 sm:space-y-0">
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
