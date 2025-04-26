import React, { useState, useEffect } from "react";
import { X, ChevronDown, Search, OctagonX } from "lucide-react";
import Map from "./Map";
import { useLinks } from "@/hooks/useLinks";
import { useGroup } from "@/hooks/useGroup";
import { getAllCollectionLinks } from "@/lib/Collection";
import { getCollections } from "@/lib/Collection";
import { Link } from "@/types/Link";
import { Collection } from "@/types/Collection";
import { Group } from "@/types/Group";
import CustomTabButton from "./CustomTabButton";

interface MapWithCollectionsProps {
  userId: string;
}

const MapWithCollections: React.FC<MapWithCollectionsProps> = ({ userId }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "groups" | "collections">("all");
  const [selectedFilters, setSelectedFilters] = useState<{
    groups: string[];
    collections: string[];
  }>({
    groups: [],
    collections: []
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [displayLinks, setDisplayLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // グループ情報を取得
  const { groups } = useGroup(userId);
  
  // リンク情報を取得
  const { links, loadLinks } = useLinks(100);

  // コレクション情報を取得
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const userCollections = await getCollections(userId);
        setCollections(userCollections);
      } catch (error) {
        console.error("コレクションの取得に失敗しました:", error);
      }
    };

    fetchCollections();
  }, [userId]);

  // 初期リンクの読み込み
  useEffect(() => {
    if (userId) {
      loadLinks(userId);
    }
  }, [userId, loadLinks]);

  // 表示するリンクを更新
  useEffect(() => {
    const updateDisplayLinks = async () => {
      setIsLoading(true);
      
      try {
        let linksToDisplay: Link[] = [];
        
        if (activeTab === "all") {
          // すべてのタブでは、選択されたフィルターに基づいてリンクを表示
          let groupLinks: Link[] = [];
          let collectionLinks: Link[] = [];
          
          // 選択されたグループのリンクを取得
          if (selectedFilters.groups.length > 0) {
            groupLinks = links.filter(link => 
              selectedFilters.groups.includes(link.groupId)
            );
          }
          
          // 選択されたコレクションのリンクを取得
          if (selectedFilters.collections.length > 0) {
            const collectionPromises = selectedFilters.collections.map(collectionId => 
              getAllCollectionLinks(collectionId)
            );
            const collectionResults = await Promise.all(collectionPromises);
            collectionLinks = collectionResults.flat();
          }
          
          // フィルターが選択されていない場合は全てのリンクを表示
          if (selectedFilters.groups.length === 0 && selectedFilters.collections.length === 0) {
            linksToDisplay = links;
          } else {
            // 両方のリンクを結合して重複を排除
            const allLinks = [...groupLinks, ...collectionLinks];
            const uniqueLinksObj: Record<string, Link> = {};
            
            allLinks.forEach(link => {
              if (!uniqueLinksObj[link.docId]) {
                uniqueLinksObj[link.docId] = link;
              }
            });
            
            linksToDisplay = Object.values(uniqueLinksObj);
          }
        } else if (activeTab === "groups" && selectedGroup) {
          // 選択されたグループのリンクをフィルタリング
          linksToDisplay = links.filter(link => link.groupId === selectedGroup);
        } else if (activeTab === "collections" && selectedCollection) {
          // 選択されたコレクションのリンクを取得
          const collectionLinks = await getAllCollectionLinks(selectedCollection);
          linksToDisplay = collectionLinks;
        }
        
        setDisplayLinks(linksToDisplay);
      } catch (error) {
        console.error("リンクの更新に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    updateDisplayLinks();
  }, [activeTab, selectedGroup, selectedCollection, links, selectedFilters]);

  useEffect(() => {
    // 検索語句に基づいてリンクをフィルタリングする
    if (searchTerm.trim() === '') {
      // 検索語句が空の場合は、現在の表示リンクをそのまま使用
      setFilteredLinks(displayLinks);
    } else {
      // 検索語句が存在する場合は、名前、住所、グループ名でフィルタリング
      const filtered = displayLinks.filter(link => {
        const searchTermLower = searchTerm.toLowerCase();
        const nameMatch = link.name && link.name.toLowerCase().includes(searchTermLower);
        const addressMatch = link.address && link.address.toLowerCase().includes(searchTermLower);
        const groupNameMatch = link.groupName && link.groupName.toLowerCase().includes(searchTermLower);
        
        return nameMatch || addressMatch || groupNameMatch;
      });
      setFilteredLinks(filtered);
    }
  }, [searchTerm, displayLinks]);

  // グループ選択ハンドラー
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
    setActiveTab("groups");
  };

  // コレクション選択ハンドラー
  const handleCollectionSelect = (collectionId: string) => {
    setSelectedCollection(collectionId);
    setActiveTab("collections");
  };

  return (
    <div className="flex flex-col h-full">
      {/* コンパクトなセレクトUI */}
      <div className="p-2 bg-white shadow-sm flex flex-col space-y-2">
        {/* 検索ボックス - すべてのタブで表示 */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="場所やグループ名を検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-3 text-base border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          {searchTerm && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm("")}
            >
             <OctagonX
              size={28}
              className="text-gray-500 hover:text-gray-700"
              />
            </button>
          )}
        </div>
        
        {/* グループ、コレクション選択メニュー - 一段下げて表示 */}
        <div className="flex space-x-2">
          {activeTab === "groups" && (
            <select
              value={selectedGroup || ""}
              onChange={(e) => {
                const groupId = e.target.value;
                if (groupId) {
                  handleGroupSelect(groupId);
                }
              }}
              className="text-sm py-1 px-2 border border-gray-300 rounded flex-grow appearance-none bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '36px' }}
            >
              <option value="">グループを選択</option>
              {groups?.map((group) => (
                <option key={group.groupId} value={group.groupId}>
                  {group.groupName}
                </option>
              ))}
            </select>
          )}
          
          {activeTab === "collections" && (
            <select
              value={selectedCollection || ""}
              onChange={(e) => {
                const collectionId = e.target.value;
                if (collectionId) {
                  handleCollectionSelect(collectionId);
                }
              }}
              className="text-sm py-1 px-2 border border-gray-300 rounded flex-grow appearance-none bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: '36px' }}
            >
              <option value="">コレクションを選択</option>
              {collections.map((collection) => (
                <option key={collection.collectionId} value={collection.collectionId}>
                  {collection.title}
                </option>
              ))}
            </select>
          )}
          
          {activeTab === "all" && (
            <>
              <select
                value={selectedFilters.groups.length > 0 ? selectedFilters.groups[0] : ""}
                onChange={(e) => {
                  const groupId = e.target.value;
                  if (groupId) {
                    // 新しいグループが選択された場合は以前の選択をクリアして新しい選択を設定
                    setSelectedFilters(prev => ({
                      ...prev,
                      groups: [groupId] // 複数選択ではなく単一選択に変更
                    }));
                  } else {
                    // 空の選択肢が選ばれた場合はグループフィルターをクリア
                    setSelectedFilters(prev => ({
                      ...prev,
                      groups: []
                    }));
                  }
                }}
                className="text-sm py-1 px-2 border border-gray-300 rounded appearance-none bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ minWidth: '120px', minHeight: '36px' }}
              >
                <option value="">グループ</option>
                {groups?.map((group) => (
                  <option 
                    key={group.groupId} 
                    value={group.groupId}
                  >
                    {group.groupName}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedFilters.collections.length > 0 ? selectedFilters.collections[0] : ""}
                onChange={(e) => {
                  const collectionId = e.target.value;
                  if (collectionId) {
                    // 新しいコレクションが選択された場合は以前の選択をクリアして新しい選択を設定
                    setSelectedFilters(prev => ({
                      ...prev,
                      collections: [collectionId] // 複数選択ではなく単一選択に変更
                    }));
                  } else {
                    // 空の選択肢が選ばれた場合はコレクションフィルターをクリア
                    setSelectedFilters(prev => ({
                      ...prev,
                      collections: []
                    }));
                  }
                }}
                className="text-sm py-1 px-2 border border-gray-300 rounded appearance-none bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ minWidth: '120px', minHeight: '36px' }}
              >
                <option value="">コレクション</option>
                {collections.map((collection) => (
                  <option 
                    key={collection.collectionId} 
                    value={collection.collectionId}
                  >
                    {collection.title}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>
        
      
      {/* 地図 */}
      <div className="flex-grow relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Map links={filteredLinks} />
        )}
      </div>
    </div>
  );
};

export default MapWithCollections;
