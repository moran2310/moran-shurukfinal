import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AdvancedJobSearch from '../components/AdvancedJobSearch';
import JobResults from '../components/JobResults';
import './EnhancedSearchResults.css';

const EnhancedSearchResults = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const params = {};
    
    // Extract search parameters from URL
    for (let [key, value] of urlParams.entries()) {
      params[key] = value;
    }
    
    setSearchParams(params);
    performSearch(params);
  }, [location.search]);

  const performSearch = async (params) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(params);
      const endpoint = params.type === 'free' 
        ? `/api/jobs/free-search?${queryParams.toString()}`
        : `/api/jobs/advanced-search?${queryParams.toString()}`;
      
      const response = await fetch(endpoint);
      const results = await response.json();
      setJobs(results);
    } catch (error) {
      console.error('Error searching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (results) => {
    setJobs(results);
  };

  const updateURL = (newParams) => {
    const queryParams = new URLSearchParams(newParams);
    navigate(`/search-results?${queryParams.toString()}`);
  };

  return (
    <div className="enhanced-search-results">
      <Navbar />
      
      <div className="search-container">
        <div className="search-header">
          <h1>חיפוש משרות</h1>
          <p>מצא את המשרה המושלמת עבורך</p>
        </div>

        <AdvancedJobSearch 
          onSearchResults={handleNewSearch}
          initialParams={searchParams}
        />

        <JobResults 
          jobs={jobs} 
          loading={loading}
        />
      </div>
    </div>
  );
};

export default EnhancedSearchResults;
