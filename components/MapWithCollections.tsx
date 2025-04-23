import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
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
  
  // フィルター選択ハンドラー（すべてタブ用）
  const toggleGroupFilter = (groupId: string) => {
    setSelectedFilters(prev => {
      const isSelected = prev.groups.includes(groupId);
      return {
        ...prev,
        groups: isSelected 
          ? prev.groups.filter(id => id !== groupId)
          : [...prev.groups, groupId]
      };
    });
  };
  
  const toggleCollectionFilter = (collectionId: string) => {
    setSelectedFilters(prev => {
      const isSelected = prev.collections.includes(collectionId);
      return {
        ...prev,
        collections: isSelected 
          ? prev.collections.filter(id => id !== collectionId)
          : [...prev.collections, collectionId]
      };
    });
  };

  // 選択されたグループまたはコレクションの情報
  const selectedGroupInfo = selectedGroup ? groups?.find(g => g.groupId === selectedGroup) : null;
  const selectedCollectionInfo = selectedCollection ? collections.find(c => c.collectionId === selectedCollection) : null;

  // 選択をクリア
  const clearSelection = () => {
    setSelectedGroup(null);
    setSelectedCollection(null);
    setSelectedFilters({ groups: [], collections: [] });
    setActiveTab("all");
  };

  return (
    <div className="flex flex-col h-full">
      {/* コンパクトなセレクトUI */}
      <div className="p-1 bg-white shadow-sm flex items-center space-x-1">
        {activeTab === "groups" && (
          <select
            value={selectedGroup || ""}
            onChange={(e) => {
              const groupId = e.target.value;
              if (groupId) {
                handleGroupSelect(groupId);
              }
            }}
            className="text-xs py-1 px-1 border border-gray-200 rounded flex-grow"
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
            className="text-xs py-1 px-1 border border-gray-200 rounded flex-grow"
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
              value=""
              onChange={(e) => {
                const groupId = e.target.value;
                if (groupId) {
                  toggleGroupFilter(groupId);
                }
              }}
              className="text-xs py-1 px-1 border border-gray-200 rounded"
              style={{ maxWidth: '120px' }}
            >
              <option value="">グループ</option>
              {groups?.map((group) => (
                <option key={group.groupId} value={group.groupId}>
                  {group.groupName}
                </option>
              ))}
            </select>
            
            <select
              value=""
              onChange={(e) => {
                const collectionId = e.target.value;
                if (collectionId) {
                  toggleCollectionFilter(collectionId);
                }
              }}
              className="text-xs py-1 px-1 border border-gray-200 rounded"
              style={{ maxWidth: '120px' }}
            >
              <option value="">コレクション</option>
              {collections.map((collection) => (
                <option key={collection.collectionId} value={collection.collectionId}>
                  {collection.title}
                </option>
              ))}
            </select>
          </>
        )}
        
        {(selectedGroup || selectedCollection || selectedFilters.groups.length > 0 || selectedFilters.collections.length > 0) && (
          <button 
            onClick={clearSelection}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* 選択情報 */}
      {(selectedFilters.groups.length > 0 || selectedFilters.collections.length > 0) && activeTab === "all" && (
        <div className="p-1 bg-gray-50 flex flex-wrap gap-1">
          {selectedFilters.groups.map(groupId => {
            const group = groups?.find(g => g.groupId === groupId);
            return group ? (
              <div key={groupId} className="flex items-center bg-blue-50 text-blue-800 px-1 py-0.5 rounded text-xs">
                <span className="truncate max-w-[80px]">{group.groupName}</span>
                <button 
                  onClick={() => toggleGroupFilter(groupId)}
                  className="ml-1 text-blue-500"
                >
                  <X size={10} />
                </button>
              </div>
            ) : null;
          })}
          
          {selectedFilters.collections.map(collectionId => {
            const collection = collections.find(c => c.collectionId === collectionId);
            return collection ? (
              <div key={collectionId} className="flex items-center bg-blue-50 text-blue-800 px-1 py-0.5 rounded text-xs">
                <span className="truncate max-w-[80px]">{collection.title}</span>
                <button 
                  onClick={() => toggleCollectionFilter(collectionId)}
                  className="ml-1 text-blue-500"
                >
                  <X size={10} />
                </button>
              </div>
            ) : null;
          })}
        </div>
      )}
      
      {/* 地図 */}
      <div className="flex-grow relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Map links={displayLinks} />
        )}
      </div>
    </div>
  );
};

export default MapWithCollections;
