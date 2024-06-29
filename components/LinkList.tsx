import React, { useState, useCallback, useRef, useEffect } from "react";
import { Grid, List, MapPin, Trash2, MessageCircle } from "lucide-react";
import { Link } from "@/types/Link";
import Toast from "./Toast";

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
            <div className="flex h-48">
              <div className="w-1/3 relative">
                <div className="absolute inset-0 bg-neutral-light">
                  <img
                    src={link.photoUrl || "/api/placeholder/150/150"}
                    alt={link.name || "場所の画像"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-2/3 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-neutral-dark">
                    {link.name}
                  </h3>
                  <p className="text-sm text-neutral mb-2">{link.address}</p>
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
                <button
                  onClick={() => handleDelete(link.docId)}
                  className="text-secondary hover:text-secondary-dark flex items-center self-start"
                  aria-label="アイテムを削除"
                >
                  <Trash2 size={16} className="mr-2 flex-shrink-0" />
                  {columns === 1 && <span>削除</span>}
                </button>
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
