import { useState, useMemo, useCallback } from 'react';
import { useLinks } from '@/hooks/useLinks';
import { filterByKeywords, filterByDateRange, sortLinks } from '@/lib/search';

const LINKS_PER_PAGE = 1000;

export function useSearch(userId: string) {
  const { links, hasMore, isLoading, loadLinks, handleLoadMore, handleDelete, searchLinksByGroup, handleTagsUpdated } =
    useLinks(LINKS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortOrder, setSortOrder] = useState<'saved' | 'name'>('saved');
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });

  const filteredLinks = useMemo(() => {
    let filtered = filterByKeywords(links, searchTerm);
    filtered = filterByDateRange(filtered, dateRange.startDate, dateRange.endDate);
    return sortLinks(filtered, sortOrder);
  }, [links, searchTerm, sortOrder, dateRange]);
  const clearSearchTerm = useCallback(async () => {
    setSearchTerm('');
    setDateRange({ startDate: null, endDate: null });
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

  const handleDateRangeChange = useCallback((startDate: Date | null, endDate: Date | null) => {
    setDateRange({ startDate, endDate });
  }, []);

  const clearDateRange = useCallback(() => {
    setDateRange({ startDate: null, endDate: null });
  }, []);

  return {
    links: filteredLinks,
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
    searchLinksByGroup,
    handleTagsUpdated
  };
}