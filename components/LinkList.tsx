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
  onFilterByUser?: (userName: string) => void;
  onFilterByGroup?: (groupName: string) => void;
}

const LinkList: React.FC<LinkListProps> = ({
  links,
  onDelete,
  onLoadMore,
  hasMore,
  isLoading,
  userId,
  onFilterByUser,
  onFilterByGroup,
}) => {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // 地図リンクを開く関数
  const handleOpenMap = useCallback((link: Link) => {
    // 場所の名前とアドレスを使ってGoogle Mapのクエリを組み立てる
    const query = encodeURIComponent(link.name || link.address || "");
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    
    if (query) {
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // ユーザー名でフィルター
  const handleUserFilter = useCallback((userName: string) => {
    if (onFilterByUser) {
      onFilterByUser(userName);
    }
  }, [onFilterByUser]);

  // グループ名でフィルター
  const handleGroupFilter = useCallback((groupName: string) => {
    if (onFilterByGroup) {
      onFilterByGroup(groupName);
    }
  }, [onFilterByGroup]);

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
    <div className="container mx-auto px-0 py-0 bg-white">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {links.map((link, index) => (
          <li
            key={`${link.docId}-${index}`}
            className="overflow-hidden flex p-0 border border-gray-100 rounded-lg"
          >
            <div 
              className="w-28 h-28 flex-shrink-0 bg-gray-100 flex items-center justify-center cursor-pointer"
            >
              {link.photoUrl ? (
                <img
                  src={link.photoUrl}
                  alt={link.name || "場所の画像"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <MapPin className="w-10 h-10 text-gray-400" />
              )}
            </div>
            
            <div className="p-3 flex-grow relative">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenMap(link);
                    }}
                    className="font-medium text-base text-gray-900 hover:text-blue-600 underline"
                  >
                    {link.name}
                  </a>
                </div>
                
                <p 
                  className="text-xs text-gray-600 mb-2 cursor-pointer hover:text-blue-600"
                  onClick={() => handleOpenMap(link)}
                >
                  {link.address}
                </p>
                
                <div className="flex items-center mt-1 mb-2">
                  {link.userPictureUrl ? (
                    <img
                      src={link.userPictureUrl}
                      alt={link.displayName || "ユーザー"}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
                  )}
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUserFilter(link.displayName || "");
                    }}
                    className="text-xs text-gray-700 hover:text-blue-600 underline"
                  >
                    {link.displayName || "ユーザー"}
                  </a>
                </div>
                
                {link.groupName && (
                  <div className="flex items-center mb-2">
                    {link.groupPictureUrl ? (
                      <img
                        src={link.groupPictureUrl}
                        alt={link.groupName}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
                    )}
                    <a 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleGroupFilter(link.groupName || "");
                      }}
                      className="text-xs text-gray-700 hover:text-blue-600 underline"
                    >
                      {link.groupName}
                    </a>
                  </div>
                )}
                
                <div className="flex justify-end mt-auto space-x-4">
                  <button
                    onClick={() => handleCollectionClick(link)}
                    className="text-blue-600 flex items-center"
                    aria-label="コレクションに追加"
                  >
                    <BookmarkPlus className="w-5 h-5" />
                    <span className="ml-1 text-xs">コレクション</span>
                  </button>
                  <button
                    onClick={() => handleDelete(link.docId)}
                    className="text-red-600 flex items-center"
                    aria-label="アイテムを削除"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="ml-1 text-xs">削除</span>
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
