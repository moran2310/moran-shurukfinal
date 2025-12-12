import React, { useState, useEffect } from 'react';
import './JobBookmarks.css';

const JobBookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setBookmarks(data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookmarks/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBookmarks(bookmarks.filter(bookmark => bookmark.job_id !== jobId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatSalary = (salary) => {
    if (!salary) return 'לא צוין';
    return salary.includes('-') ? `${salary} ₪` : `${salary} ₪`;
  };

  if (loading) {
    return (
      <div className="bookmarks-loading">
        <div className="spinner"></div>
        <p>טוען משרות שמורות...</p>
      </div>
    );
  }

  return (
    <div className="job-bookmarks">
      <div className="bookmarks-header">
        <h2>משרות שמורות</h2>
        <span className="bookmarks-count">{bookmarks.length} משרות</span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="no-bookmarks">
          <div className="no-bookmarks-icon">🔖</div>
          <h3>אין משרות שמורות</h3>
          <p>שמור משרות מעניינות כדי לחזור אליהן מאוחר יותר</p>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmark-card">
              <div className="bookmark-header">
                <div className="job-info">
                  <h3>{bookmark.job_title}</h3>
                  <p className="company-name">{bookmark.company_name}</p>
                  <p className="job-location">📍 {bookmark.location}</p>
                </div>
                <button 
                  className="remove-bookmark"
                  onClick={() => removeBookmark(bookmark.job_id)}
                  title="הסר מהשמורות"
                >
                  ❌
                </button>
              </div>

              <div className="bookmark-details">
                <div className="salary-info">
                  <span className="salary-label">שכר:</span>
                  <span className="salary-amount">{formatSalary(bookmark.salary)}</span>
                </div>
                <div className="bookmark-date">
                  <span>נשמר: {formatDate(bookmark.created_at)}</span>
                </div>
              </div>

              <div className="bookmark-description">
                <p>{bookmark.description?.substring(0, 150)}...</p>
              </div>

              <div className="bookmark-actions">
                <button className="view-job-btn">
                  צפה במשרה
                </button>
                <button className="apply-job-btn">
                  הגש מועמדות
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobBookmarks;
