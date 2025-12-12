import { useState, useMemo } from 'react';

export const useFilter = (items, filterConfig) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return filterConfig.searchFields.some(field => {
          const value = item[field];
          if (Array.isArray(value)) {
            return value.some(v => v.toLowerCase().includes(searchLower));
          }
          return value?.toLowerCase().includes(searchLower);
        });
      }

      return true;
    });
  }, [items, searchTerm, statusFilter, filterConfig]);

  return {
    filteredItems,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter
  };
};
