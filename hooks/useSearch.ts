import { useState, useMemo, useCallback } from 'react';
import { Link } from '@/types/Link';
import { useLinks } from '@/hooks/useLinks';
import { useDebounce } from './useDebounce';

const LINKS_PER_PAGE = 5;
const SEARCH_THRESHOLD = 20;
const DEBOUNCE_DELAY = 300;

export function useSearch(userId: string) {
  const { links, hasMore, isLoading, loadLinks, handleLoadMore, handleDelete, searchLinks } =
    useLinks(LINKS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredLinks = useMemo(() => {
    if (!searchTerm) return links;
    const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
    return links.filter(link =>
      searchTerms.every(term =>
        link.name.toLowerCase().includes(term) ||
        link.address.toLowerCase().includes(term)
      )
    );
  }, [links, searchTerm]);

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
    loadLinks
  };
}