import { useState, useMemo, useCallback } from 'react';
import { useLinks } from '@/hooks/useLinks';
import { useDebounce } from './useDebounce';

const LINKS_PER_PAGE = 100;
const SEARCH_THRESHOLD = 20;
const DEBOUNCE_DELAY = 300;

export function useSearch(userId: string) {
  const { links, hasMore, isLoading, loadLinks, handleLoadMore, handleDelete, searchLinks, searchLinksByGroup } =
    useLinks(LINKS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredLinks = useMemo(() => {
    if (!searchTerm) return links;
    const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
    return links.filter(link =>
      searchTerms.every(term =>
        (link.name && link.name.toLowerCase().includes(term)) ||
        (link.address && link.address.toLowerCase().includes(term)) ||
        (link.groupName && link.groupName.toLowerCase().includes(term)) ||
        (link.displayName && link.displayName.toLowerCase().includes(term))
      )
    );
  }, [links, searchTerm]);
  const clearSearchTerm = useCallback(async () => {
    setSearchTerm('');
    setIsSearching(true);
    try {
      await loadLinks(userId);
    } finally {
      setIsSearching(false);
    }
  }, [userId, loadLinks]);

  const debouncedSearch = useDebounce(async (term: string) => {
    setIsSearching(true);
    await searchLinks(userId, term);
    setIsSearching(false);
  }, DEBOUNCE_DELAY);

  const handleSearchInputChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);

    if (links.length > SEARCH_THRESHOLD) {
      debouncedSearch(newSearchTerm);
    }
  }, [links.length, debouncedSearch]);

  return {
    links: filteredLinks,
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
  };
}