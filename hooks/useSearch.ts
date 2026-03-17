import { useState, useMemo, useCallback } from 'react';
import { useLinks } from '@/hooks/useLinks';

const LINKS_PER_PAGE = 1000;

export function useSearch(userId: string) {
  const { links, hasMore, isLoading, loadLinks, handleLoadMore, handleDelete, searchLinksByGroup } =
    useLinks(LINKS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortOrder, setSortOrder] = useState<'saved' | 'name'>('saved');
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });

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

    // 日付範囲でフィルタリング
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(link => {
        if (!link.timestamp) return false;
        
        const linkDate = link.timestamp.toDate();
        linkDate.setHours(0, 0, 0, 0); // 時刻を00:00:00にリセット
        
        if (dateRange.startDate && dateRange.endDate) {
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return linkDate >= startDate && linkDate <= endDate;
        } else if (dateRange.startDate) {
          const startDate = new Date(dateRange.startDate);
          startDate.setHours(0, 0, 0, 0);
          return linkDate >= startDate;
        } else if (dateRange.endDate) {
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          return linkDate <= endDate;
        }
        return true;
      });
    }

    // 並び替え
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'name') {
        return (a.name || '').localeCompare(b.name || '', 'ja');
      } else {
        // 保存した順（timestampの降順）
        return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
      }
    });
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
    searchLinksByGroup
  };
}