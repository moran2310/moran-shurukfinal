import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import './LiveSearch.css';

const LiveSearch = ({ type = 'jobs', onResultsChange }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    experience: '',
    jobType: '',
    salary: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // WebSocket connection for real-time updates
  const { data: wsData, error: wsError, isConnected } = useWebSocket('ws://localhost:5000');

  const searchItems = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        q: query,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        )
      });

      const response = await fetch(`/api/${type}/search?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      const data = await response.json();
      
      setResults(data);
      onResultsChange?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query || Object.values(filters).some(v => v)) {
        searchItems();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters]);

  // Update results when WebSocket data changes
  useEffect(() => {
    if (wsData?.type === type) {
      setResults(prev => {
        const updatedResults = [...prev];
        const itemIndex = updatedResults.findIndex(item => item.id === wsData.data.id);
        
        // Only update if the item matches current filters
        const matchesFilters = Object.entries(filters).every(([key, value]) => {
          return !value || wsData.data[key] === value;
        });

        const matchesQuery = !query || 
          wsData.data.title?.toLowerCase().includes(query.toLowerCase()) ||
          wsData.data.description?.toLowerCase().includes(query.toLowerCase());

        if (matchesFilters && matchesQuery) {
          if (itemIndex === -1 && wsData.action === 'add') {
            updatedResults.unshift(wsData.data);
          } else if (itemIndex !== -1) {
            if (wsData.action === 'update') {
              updatedResults[itemIndex] = { ...updatedResults[itemIndex], ...wsData.data };
            } else if (wsData.action === 'delete') {
              updatedResults.splice(itemIndex, 1);
            }
          }
        }
        
        return updatedResults;
      });
    }
  }, [wsData]);

  return (
    <div className="live-search">
      <div className="search-header">
        <div className="search-input-wrapper">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={type === 'jobs' ? 'חפש משרות...' : 'חפש מועמדים...'}
            className="search-input"
          />
        </div>
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterListIcon />
          סינון
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>קטגוריה</label>
            <select 
              value={filters.category}
              onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">הכל</option>
              <option value="tech">הייטק</option>
              <option value="logistics">לוגיסטיקה ותפעול</option>
              <option value="sales">מכירות ושיווק</option>
            </select>
          </div>

          <div className="filter-group">
            <label>מיקום</label>
            <select
              value={filters.location}
              onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
            >
              <option value="">הכל</option>
              <option value="tel-aviv">תל אביב והמרכז</option>
              <option value="jerusalem">ירושלים והסביבה</option>
              <option value="north">צפון</option>
              <option value="south">דרום</option>
            </select>
          </div>

          {type === 'jobs' && (
            <>
              <div className="filter-group">
                <label>סוג משרה</label>
                <select
                  value={filters.jobType}
                  onChange={e => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                >
                  <option value="">הכל</option>
                  <option value="full-time">משרה מלאה</option>
                  <option value="part-time">משרה חלקית</option>
                  <option value="contract">פרילנס</option>
                </select>
              </div>

              <div className="filter-group">
                <label>טווח שכר</label>
                <select
                  value={filters.salary}
                  onChange={e => setFilters(prev => ({ ...prev, salary: e.target.value }))}
                >
                  <option value="">הכל</option>
                  <option value="0-15000">עד 15,000 ₪</option>
                  <option value="15000-25000">15,000 - 25,000 ₪</option>
                  <option value="25000+">מעל 25,000 ₪</option>
                </select>
              </div>
            </>
          )}

          {type === 'candidates' && (
            <div className="filter-group">
              <label>ניסיון</label>
              <select
                value={filters.experience}
                onChange={e => setFilters(prev => ({ ...prev, experience: e.target.value }))}
              >
                <option value="">הכל</option>
                <option value="junior">ג'וניור (0-2 שנים)</option>
                <option value="mid">מידל (2-5 שנים)</option>
                <option value="senior">סניור (5+ שנים)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {loading && <div className="search-loading">טוען תוצאות...</div>}
      {error && <div className="search-error">{error}</div>}
      
      {!loading && !error && results.length === 0 && (
        <div className="no-results">לא נמצאו תוצאות</div>
      )}
    </div>
  );
};

export default LiveSearch;
