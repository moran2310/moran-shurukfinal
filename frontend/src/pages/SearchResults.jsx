import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./SearchResults.css";

const SearchResults = () => {
  // const [searchParams] = useSearchParams(); // Currently unused
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    const params = new URLSearchParams(location.search);
    const searchType = params.get("type");

    try {
      setLoading(true);
      let url;

      if (searchType === "free") {
        url = `${API_BASE_URL}/api/jobs/free-search?query=${params.get(
          "query"
        )}`;
      } else {
        const queryParams = {
          field: params.get("field"),
          role: params.get("role"),
          jobType: params.get("jobType"),
          city: params.get("city"),
        };
        url = `${API_BASE_URL}/api/jobs/search?${new URLSearchParams(
          queryParams
        )}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (!Array.isArray(data)) {
        setResults([]);
        setError("No results found");
        return;
      }
      setResults(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">טוען תוצאות...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="results-header">
        <h1>תוצאות חיפוש</h1>
        <div className="results-count">
          נמצאו {results.length} משרות מתאימות
        </div>
      </div>

      {results.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h2>לא נמצאו תוצאות</h2>
          <p>נסה לשנות את החיפוש שלך</p>
        </div>
      ) : (
        <div className="results-grid">
          {results.map((job) => (
            <div key={job.JobID} className="job-card">
              <h2>{job.JobTitle}</h2>
              <div className="job-details">
                <p>
                  <strong>חברה:</strong> {job.CompanyName}
                </p>
                <p>
                  <strong>עיר:</strong> {job.CityName}
                </p>
                <p>
                  <strong>תפקיד:</strong> {job.Position}
                </p>
                {job.Salary && (
                  <p>
                    <strong>שכר:</strong> {job.Salary}
                  </p>
                )}
              </div>
              <div className="job-description">
                <p>{job.Description}</p>
                {job.Requirements && (
                  <p>
                    <strong>דרישות:</strong> {job.Requirements}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate(`/job/${job.JobID}`)}
                className="apply-button"
              >
                פרטים נוספים
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
