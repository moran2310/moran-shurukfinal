import React, { useState, useEffect } from 'react';
import './AdvancedJobSearch.css';

const AdvancedJobSearch = ({ onSearchResults }) => {
  const [searchParams, setSearchParams] = useState({
    query: '',
    location: '',
    jobType: '',
    experience: '',
    salary: '',
    category: '',
    company: '',
    datePosted: '',
    remote: false
  });

  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCities();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/fields');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities');
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/jobs/advanced-search?${queryParams.toString()}`);
      const results = await response.json();
      
      if (onSearchResults) {
        onSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchParams({
      query: '',
      location: '',
      jobType: '',
      experience: '',
      salary: '',
      category: '',
      company: '',
      datePosted: '',
      remote: false
    });
  };

  return (
    <div className="advanced-job-search">
      <form onSubmit={handleSearch} className="search-form">
        {/* Main Search Bar */}
        <div className="main-search-row">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="חפש משרות, חברות או מילות מפתח..."
              value={searchParams.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
              className="main-search-input"
            />
          </div>
          
          <div className="location-input-container">
            <select
              value={searchParams.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="location-select"
            >
              <option value="">כל המקומות</option>
              {cities.map(city => (
                <option key={city.CityID} value={city.CityName}>
                  {city.CityName}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'מחפש...' : 'חיפוש'}
          </button>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="advanced-toggle">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="toggle-advanced-btn"
          >
            {showAdvanced ? 'הסתר מסננים מתקדמים' : 'הצג מסננים מתקדמים'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>סוג משרה</label>
                <select
                  value={searchParams.jobType}
                  onChange={(e) => handleInputChange('jobType', e.target.value)}
                >
                  <option value="">כל הסוגים</option>
                  <option value="full-time">משרה מלאה</option>
                  <option value="part-time">משרה חלקית</option>
                  <option value="freelance">פרילנס</option>
                  <option value="student">סטודנט</option>
                </select>
              </div>

              <div className="filter-group">
                <label>ניסיון נדרש</label>
                <select
                  value={searchParams.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                >
                  <option value="">כל הרמות</option>
                  <option value="0">ללא ניסיון</option>
                  <option value="1-2">1-2 שנים</option>
                  <option value="3-5">3-5 שנים</option>
                  <option value="5+">5+ שנים</option>
                </select>
              </div>

              <div className="filter-group">
                <label>טווח שכר</label>
                <select
                  value={searchParams.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                >
                  <option value="">כל הטווחים</option>
                  <option value="8-12">8,000-12,000 ₪</option>
                  <option value="12-16">12,000-16,000 ₪</option>
                  <option value="16-20">16,000-20,000 ₪</option>
                  <option value="20+">20,000+ ₪</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>תחום</label>
                <select
                  value={searchParams.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">כל התחומים</option>
                  {categories.map(category => (
                    <option key={category.CategoryID} value={category.CategoryID}>
                      {category.CategoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>חברה</label>
                <input
                  type="text"
                  placeholder="שם החברה"
                  value={searchParams.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>פורסם בימים האחרונים</label>
                <select
                  value={searchParams.datePosted}
                  onChange={(e) => handleInputChange('datePosted', e.target.value)}
                >
                  <option value="">כל התאריכים</option>
                  <option value="1">יום אחד</option>
                  <option value="7">שבוע</option>
                  <option value="30">חודש</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={searchParams.remote}
                    onChange={(e) => handleInputChange('remote', e.target.checked)}
                  />
                  עבודה מרחוק
                </label>
              </div>

              <div className="filter-actions">
                <button type="button" onClick={clearFilters} className="clear-filters-btn">
                  נקה מסננים
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdvancedJobSearch;
