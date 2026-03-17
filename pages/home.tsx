import React, { useState, useEffect, useCallback } from "react";
import { useLiff } from "@/hooks/useLiff";
import LinkList from "@/components/LinkList";
import Header from "@/components/Header";
import Map from "@/components/Map";
import MapWithCollections from "@/components/MapWithCollections";
import { useProfile } from "@/hooks/useProfile";
import { useSearch } from "@/hooks/useSearch";
import { Tab, TabButton } from "@/components/TabButton";
import { OctagonX, Search } from "lucide-react";
import { useGroup } from "@/hooks/useGroup";
import liff from "@line/liff";
import { Collection } from "@/types/Collection";
import CollectionDetail from "@/components/CollectionDetail";
import { CollectionList } from "@/components/CollectionList";
import DateRangeFilter from "@/components/DateRangeFilter";
import { useRouter } from "next/router";
import { getCollectionById } from '@/lib/Collection'; // Collectionライブラリをインポート
import SEO from "@/components/SEO";

export default function Home() {
  const { profile, loading: profileLoading } = useProfile();
  const { logout } = useLiff();
  const router = useRouter();
  const activeTab = (router.query.tab as Tab) || "list";
  const collectionId = router.query.collectionId as string;
  const [inputValue, setInputValue] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);

  const {
    links,
    searchTerm,
    isSearching,
    hasMore,
    isLoading,
    sortOrder,
    dateRange,
    handleSearchInputChange,
    handleSortChange,
    handleDateRangeChange,
    clearDateRange,
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

  // コレクションデータの取得
  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) {
        setSelectedCollection(null);
        return;
      }

      try {
        setIsLoadingCollection(true);
        const collection = await getCollectionById(collectionId);
        if (collection) {
          setSelectedCollection(collection);
        }
      } catch (error) {
        console.error('Failed to fetch collection:', error);
      } finally {
        setIsLoadingCollection(false);
      }
    };

    // router.isReadyを確認してからフェッチを実行
    if (router.isReady) {
      fetchCollection();
    }
  }, [collectionId, router.isReady]);

  // タブ切り替え処理
  const handleTabChange = (tab: Tab) => {
    const query: { tab?: string; collectionId?: string } = { tab };
    if (tab !== "collections") {
      delete query.collectionId;
      setSelectedCollection(null);
    }
    router.push({
      pathname: router.pathname,
      query
    });
  };

  // コレクション選択処理
  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    router.push({
      pathname: router.pathname,
      query: {
        tab: "collections",
        collectionId: collection.collectionId
      }
    });
  };

  // コレクション一覧に戻る処理
  const handleBackToCollections = () => {
    setSelectedCollection(null);
    router.push({
      pathname: router.pathname,
      query: { tab: "collections" }
    });
  };

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

  // ユーザー名でフィルタリングする関数
  const handleFilterByUser = useCallback((userName: string) => {
    setInputValue(userName);
    handleSearchInputChange(userName);
  }, [handleSearchInputChange]);

  // グループ名でフィルタリングする関数
  const handleFilterByGroup = useCallback((groupName: string) => {
    setInputValue(groupName);
    handleSearchInputChange(groupName);
  }, [handleSearchInputChange]);

  // タブごとの動的なタイトル設定
  const getPageTitle = () => {
    switch (activeTab) {
      case "list":
        return "リンク一覧";
      case "map":
        return "マップ";
      case "collections":
        if (selectedCollection) {
          return selectedCollection.title;
        }
        return "コレクション";
      default:
        return "ホーム";
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case "list":
        return "保存したリンクの一覧を表示します。検索やフィルタリングで目的のリンクを簡単に見つけられます。";
      case "map":
        return "保存したリンクを地図上で確認できます。場所の位置関係を視覚的に把握できます。";
      case "collections":
        if (selectedCollection) {
          return `${selectedCollection.title}のコレクション詳細。保存されたリンクを整理して管理できます。`;
        }
        return "コレクション機能でリンクを整理して管理できます。お気に入りの場所をカテゴリ別にまとめましょう。";
      default:
        return "Map MemoはLINEボットを通じてGoogle Mapsの場所を簡単に保存・管理できるアプリです。";
    }
  };

  if (profileLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SEO
        title={getPageTitle()}
        description={getPageDescription()}
      />
      <div className="flex flex-col h-screen bg-gray-100">
        <Header profile={profile} logout={logout} />
        <div className="flex space-x-1 px-2 py-1 bg-white shadow">
          <TabButton
            tab="list"
            label="リンク一覧"
            activeTab={activeTab}
            onClick={() => handleTabChange("list")}
          />
          <TabButton
            tab="map"
            label="マップ"
            activeTab={activeTab}
            onClick={() => handleTabChange("map")}
          />
          <TabButton
            tab="collections"
            label="コレクション"
            activeTab={activeTab}
            onClick={() => handleTabChange("collections")}
          />
        </div>
        {activeTab === "list" && (
          <div className="px-2 py-1 bg-white">
            <div className="flex items-center gap-1 mb-2 mt-1">
              <select
                value={selectedGroup?.groupId ?? ""}
                onChange={(e)=>handleGroupSelect(e.target.value)}
                className="flex-1 py-1 px-2 border rounded text-xs"
              >
                <option value="">すべてのグループ</option>
                {groups?.map((group) => (
                  <option key={group.groupId} value={group.groupId}>
                    {group.groupName}
                  </option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => handleSortChange(e.target.value as 'saved' | 'name')}
                className="py-1 px-2 border rounded text-xs"
              >
                <option value="saved">保存順</option>
                <option value="name">名前順</option>
              </select>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="名前, 住所, 地点名, グループ名で検索"
                className="w-full py-2 px-3 pr-20 border rounded text-base"
              />
              {inputValue && (
                <div 
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 cursor-pointer"
                  onClick={handleClear}
                >
                  <OctagonX
                    size={28}
                    className="text-gray-500 hover:text-gray-700"
                  />
                </div>
              )}
              <button
                onClick={executeSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded bg-primary text-white hover:bg-blue-700"
                disabled={isSearching || !inputValue}
                aria-label="検索"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-hidden">
          {activeTab === "map" && <MapWithCollections userId={profile?.userId ?? ""} />}
          {activeTab === "list" && (
            <div className="h-full overflow-auto p-4">
              <DateRangeFilter
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateRangeChange={handleDateRangeChange}
                onClear={clearDateRange}
              />
              <LinkList
                links={links}
                onDelete={handleDelete}
                onLoadMore={handleLoadMore}
                hasMore={hasMore && !searchTerm}
                isLoading={isLoading || isSearching}
                userId={profile?.userId ?? ""}
                onFilterByUser={handleFilterByUser}
                onFilterByGroup={handleFilterByGroup}
              />
            </div>
          )}
          {activeTab === "collections" && !collectionId && (
            <div className="h-full overflow-auto p-4">
              <CollectionList
                userId={profile?.userId ?? ""}
                onCollectionSelect={handleCollectionSelect}
              />
            </div>
          )}
          {activeTab === "collections" && collectionId && (
            <div className="h-full overflow-auto p-4">
              {isLoadingCollection ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : selectedCollection ? (
                <CollectionDetail
                  collection={selectedCollection}
                  onBack={handleBackToCollections}
                />
              ) : (
                <div className="text-center py-4">
                  コレクションが見つかりません
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
