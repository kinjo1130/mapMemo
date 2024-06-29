import React from "react";
import { useLiff } from "@/hooks/useLiff";
import LinkList from "@/components/LinkList";
import Header from "@/components/Header";
import { useLinks } from "@/hooks/useLinks";
import { useProfile } from "@/hooks/useProfile";

const LINKS_PER_PAGE = 5;

export default function Home() {
  const { profile, loading: profileLoading } = useProfile();
  const { links, hasMore, isLoading, loadLinks, handleLoadMore, handleDelete } =
    useLinks(LINKS_PER_PAGE);
  const { logout } = useLiff();

  React.useEffect(() => {
    if (profile) {
      loadLinks(profile.userId);
    }
  }, [profile, loadLinks]);

  if (profileLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header profile={profile} logout={logout} />
      <main className="container mx-auto p-4">
        <LinkList
          links={links}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
