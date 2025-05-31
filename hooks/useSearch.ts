import { useState, useMemo, useCallback } from 'react';
import { useLinks } from '@/hooks/useLinks';

const LINKS_PER_PAGE = 1000;

export function useSearch(userId: string) {
  const { links, hasMore, isLoading, loadLinks, handleLoadMore, handleDelete, searchLinksByGroup } =
    useLinks(LINKS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortOrder, setSortOrder] = useState<'saved' | 'name'>('saved');

  const filteredLinks = useMemo(() => {
    let filtered = searchTerm 
      ? links.filter(link => {
          const searchTerms = searchTerm.toLowerCase().split(/\s+|\u3000+/).filter(term => term.length > 0);
          return searchTerms.every(term =>
            (link.name && link.name.toLowerCase().includes(term)) ||
            (link.address && link.address.toLowerCase().includes(term)) ||
            (link.groupName && link.groupName.toLowerCase().includes(term)) ||
            (link.displayName && link.displayName.toLowerCase().includes(term))
          );
        })
      : links;

    // 並び替え
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'name') {
        return (a.name || '').localeCompare(b.name || '', 'ja');
      } else {
        // 保存した順（timestampの降順）
        return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
      }
    });
  }, [links, searchTerm, sortOrder]);
  const clearSearchTerm = useCallback(async () => {
    setSearchTerm('');
    setIsSearching(true);
    try {
      await loadLinks(userId);
    } finally {
      setIsSearching(false);
    }
  }, [userId, loadLinks]);

  const handleSearchInputChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  }, [links.length]);

  const handleSortChange = useCallback((newSortOrder: 'saved' | 'name') => {
    setSortOrder(newSortOrder);
  }, []);

  return {
    links: filteredLinks,
    searchTerm,
    isSearching,
    hasMore,
    isLoading,
    sortOrder,
    handleSearchInputChange,
    handleSortChange,
    handleLoadMore,
    handleDelete,
    loadLinks,
    clearSearchTerm,
    searchLinksByGroup
  };
}