import { useEffect, useCallback, useRef, useState } from "react";
import { MapPin, Trash2, MessageCircle, BookmarkPlus } from "lucide-react";
import Toast from "./Toast";
import CollectionModal from "./CollectionModal";
import type { Link } from "@/types/Link";

interface LinkListProps {
  links: Link[];
  onDelete: (id: string) => Promise<void>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading: boolean;
  userId: string;
}

const LinkList: React.FC<LinkListProps> = ({
  links,
  onDelete,
  onLoadMore,
  hasMore,
  isLoading,
  userId,
}) => {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

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

  const handleCollectionClick = (link: Link) => {
    setSelectedLink(link);
  };

  const handleCloseModal = () => {
    setSelectedLink(null);
  };

  if (links.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white shadow-lg rounded-xl p-6 md:p-8 text-center">
          <MessageCircle className="mx-auto text-blue-600 w-12 h-12 md:w-16 md:h-16 mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
            リンクがまだありません
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            ボットにGoogle Mapのリンクを送って、お気に入り場所のリンクを登録してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ul className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {links.map((link, index) => (
          <li
            key={`${link.docId}-${index}`}
            // ref={index === links.length - 1 ? lastLinkElementRef : null}
            className="bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden"
          >
            <div className="flex flex-col h-full">
              <div className="w-full h-40 sm:h-44 relative">
                <img
                  src={link.photoUrl || "/api/placeholder/150/150"}
                  alt={link.name || "場所の画像"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <div className="flex-grow space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg sm:text-xl text-gray-900 line-clamp-2 leading-tight">
                      {link.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {link.address}
                    </p>
                  </div>

                  <a
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm group"
                  >
                    <MapPin className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="underline">Google Map</span>
                  </a>

                  <div className="flex items-center space-x-3 mt-4">
                    {link.userPictureUrl && (
                      <img
                        src={link.userPictureUrl}
                        alt={link.displayName}
                        className="w-8 h-8 rounded-full ring-2 ring-gray-100"
                        loading="lazy"
                      />
                    )}
                    <span className="text-sm text-gray-700">
                      {link.displayName}
                    </span>
                  </div>

                  {link.groupId && (
                    <div className="flex items-center space-x-3">
                      {link.groupPictureUrl && (
                        <img
                          src={link.groupPictureUrl}
                          alt={link.groupName}
                          className="w-8 h-8 rounded-full ring-2 ring-gray-100"
                          loading="lazy"
                        />
                      )}
                      <span className="text-sm text-gray-700">
                        {link.groupName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-4 pt-3 border-t border-gray-100 space-x-4">
                  <button
                    onClick={() => handleCollectionClick(link)}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm group"
                    aria-label="コレクションに追加"
                  >
                    <BookmarkPlus className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
                    <span>コレクション</span>
                  </button>
                  <button
                    onClick={() => handleDelete(link.docId)}
                    className="inline-flex items-center text-red-600 hover:text-red-800 text-sm group"
                    aria-label="アイテムを削除"
                  >
                    <Trash2 className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
                    <span>削除</span>
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {isLoading && (
        <div className="flex justify-center items-center mt-8 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span>読み込み中...</span>
        </div>
      )}

      {!isLoading && hasMore && (
        <button
          onClick={onLoadMore}
          className="mt-8 mx-auto block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          さらに読み込む
        </button>
      )}

      {selectedLink && (
        <CollectionModal
          isOpen={!!selectedLink}
          onClose={handleCloseModal}
          link={selectedLink}
          userId={userId}
        />
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