import React, { useState, useEffect } from "react";
import { useLiff } from "@/hooks/useLiff";
import LinkList from "@/components/LinkList";
import Header from "@/components/Header";
import Map from "@/components/Map";
import { useProfile } from "@/hooks/useProfile";
import { useSearch } from "@/hooks/useSearch";
import { TabButton } from "@/components/TabButton";
import { OctagonX } from "lucide-react";

type Tab = "map" | "list";

export default function Home() {
  const { profile, loading: profileLoading } = useProfile();
  const { logout } = useLiff();
  const [activeTab, setActiveTab] = useState<Tab>("list");

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
  } = useSearch(profile?.userId ?? "");

  useEffect(() => {
    if (profile) {
      loadLinks(profile.userId);
    }
  }, [profile, loadLinks]);

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
          onClick={setActiveTab}
        />
        <TabButton
          tab="map"
          label="マップ"
          activeTab={activeTab}
          onClick={setActiveTab}
        />
      </div>
      <div className="px-4 py-2 bg-white">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder="検索..."
            className="w-full p-2 border rounded"
          />
          {searchTerm && (
            <OctagonX
              className="absolute right-2 top-2 cursor-pointer"
              onClick={clearSearchTerm}
            />
          )}
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
            />
          </div>
        )}
      </main>
    </div>
  );
}
