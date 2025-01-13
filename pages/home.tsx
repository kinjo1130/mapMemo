import React, { useState, useEffect } from "react";
import { useLiff } from "@/hooks/useLiff";
import LinkList from "@/components/LinkList";
import Header from "@/components/Header";
import Map from "@/components/Map";
import { useProfile } from "@/hooks/useProfile";
import { useSearch } from "@/hooks/useSearch";
import { Tab, TabButton } from "@/components/TabButton";
import { OctagonX, Search } from "lucide-react";
import { useGroup } from "@/hooks/useGroup";
import liff from "@line/liff";
import { Collection } from "@/types/Collection";
import CollectionDetail from "@/components/CollectionDetail";
import { CollectionList } from "@/components/CollectionList";


export default function Home() {
  const { profile, loading: profileLoading } = useProfile();
  const { logout } = useLiff();
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [inputValue, setInputValue] = useState(""); // 入力中の検索語を保持
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
  };
  const {
    links,
    searchTerm,
    isSearching,
    hasMore,
    isLoading,
    handleSearchInputChange,
    handleLoadMore,
    handleDelete,
    loadLinks,
    clearSearchTerm,
    searchLinksByGroup
  } = useSearch(profile?.userId ?? "");
  const {
    groups,
    selectedGroup,
    handleSelectGroup
  } = useGroup(profile?.userId ?? "");
  const { isAuthenticated } = useLiff();

  useEffect(() => {
    if (profile) {
      loadLinks(profile.userId);
    }
  }, [profile, loadLinks]);

  useEffect(() => {
    if (liff) {
      if (liff.getOS() !== "web") {
        document.title = "MapMemo";
      }
    }
  }, [liff]);

  // 検索を実行する関数
  const executeSearch = () => {
    if (!inputValue.trim()) {
      // 入力が空の場合は検索をクリアして全データを再取得
      handleClear();
      return;
    }
    handleSearchInputChange(inputValue);
  };

  // クリアボタンのハンドラー
  const handleClear = () => {
    setInputValue("");
    clearSearchTerm();
    if(selectedGroup){
      searchLinksByGroup(profile?.userId ?? "", selectedGroup.groupId);
    }
  };

  // Enter キーのハンドラー
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeSearch();
    }
  };
  // グループ選択時のハンドラー
  const handleGroupSelect = (groupId: string) => {
    handleSelectGroup(groupId);
    if (profile) {
      searchLinksByGroup(profile.userId, groupId);
    }
  };

  if (profileLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header profile={profile} logout={logout} />
      <div className="flex space-x-2 px-4 bg-white shadow">
        <TabButton
          tab="list"
          label="リンク一覧"
          activeTab={activeTab}
          onClick={() => setActiveTab("list")}
        />
        {/* <TabButton
          tab="map"
          label="マップ"
          activeTab={activeTab}
          onClick={() => setActiveTab("map")}
        /> */}
       <TabButton
          tab="collections"
          label="コレクション"
          activeTab={activeTab}
          onClick={() => setActiveTab("collections")}
        />
      </div>
      <div className="px-4 py-2 bg-white">
        <div className="flex items-center gap-2 mb-5 mt-2">
          <select
            value={selectedGroup?.groupId ?? ""}
            onChange={(e)=>handleGroupSelect(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">すべてのグループ</option>
            {groups?.map((group) => (
              <option key={group.groupId} value={group.groupId}>
                {group.groupName}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="検索..."
            className="w-full p-2 pr-20 border rounded text-base"
          />
          {inputValue && (
            <OctagonX
              className="absolute right-12 top-2 cursor-pointer"
              onClick={handleClear}
            />
          )}
          <button
            onClick={executeSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded bg-primary text-white"
            disabled={isSearching || !inputValue}
          >
            <Search size={20} />
          </button>
        </div>
      </div>
      <main className="flex-1 overflow-hidden">
        {activeTab === "map" && <Map links={links} />}
        {activeTab === "list" && (
          <div className="h-full overflow-auto p-4">
            <LinkList
              links={links}
              onDelete={handleDelete}
              onLoadMore={handleLoadMore}
              hasMore={hasMore && !searchTerm}
              isLoading={isLoading || isSearching}
              userId={profile?.userId ?? ""}
            />
          </div>
        )}
         {activeTab === "collections" && !selectedCollection && (
          <div className="h-full overflow-auto p-4">
            <CollectionList
              userId={profile?.userId ?? ""}
              onCollectionSelect={handleCollectionSelect}
            />
          </div>
        )}
        {activeTab === "collections" && selectedCollection && (
          <div className="h-full overflow-auto p-4">
            <CollectionDetail
              collection={selectedCollection}
              onBack={handleBackToCollections}
            />
          </div>
        )}
      </main>
    </div>
  );
}