import React, { useState } from 'react';
import './JobResults.css';

const JobResults = ({ jobs = [], loading = false }) => {
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('list');
  // Store selected CV files keyed by job ID.  When applying for a job we
  // require a CV to be selected; after a successful application the file
  // entry is removed.
  const [cvFiles, setCvFiles] = useState({});

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.CreatedAt) - new Date(a.CreatedAt);
      case 'salary':
        const aSalary = parseInt(a.Salary?.split('-')[0] || '0');
        const bSalary = parseInt(b.Salary?.split('-')[0] || '0');
        return bSalary - aSalary;
      case 'title':
        return a.JobTitle.localeCompare(b.JobTitle);
      case 'company':
        return (a.CompanyName || '').localeCompare(b.CompanyName || '');
      default:
        return 0;
    }
  });

  const formatSalary = (salary) => {
    if (!salary) return 'לא צוין';
    return salary.includes('-') ? `${salary} ₪` : `${salary} ₪`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'היום';
    if (diffDays === 2) return 'אתמול';
    if (diffDays <= 7) return `לפני ${diffDays} ימים`;
    if (diffDays <= 30) return `לפני ${Math.ceil(diffDays / 7)} שבועות`;
    return date.toLocaleDateString('he-IL');
  };

  const handleApplyJob = async (jobId) => {
    // Ensure a CV file has been selected for this job
    const file = cvFiles[jobId];
    if (!file) {
      alert('אנא העלה קובץ קורות חיים לפני הגשת המועמדות');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Upload CV
      const formData = new FormData();
      formData.append('cv', file);
      const uploadRes = await fetch('/api/upload-cv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || uploadData.message || 'שגיאה בהעלאת קורות החיים');
      }
      // Apply to job
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.error || resData.message || 'שגיאה בשליחת הבקשה');
      }
      alert('הבקשה נשלחה בהצלחה!');
      // Clear the stored file for this job
      setCvFiles(prev => {
        const copy = { ...prev };
        delete copy[jobId];
        return copy;
      });
    } catch (error) {
      console.error('Error applying for job:', error);
      alert(error.message || 'שגיאה בשליחת הבקשה');
    }
  };

  // Handle file selection for a job.  Only the first file is stored.
  const handleFileChange = (e, jobId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setCvFiles(prev => ({ ...prev, [jobId]: file }));
  };

  if (loading) {
    return (
      <div className="job-results loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>מחפש משרות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-results">
      <div className="results-header">
        <div className="results-info">
          <h2>נמצאו {jobs.length} משרות</h2>
        </div>
        
        <div className="results-controls">
          <div className="sort-controls">
            <label>מיין לפי:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">תאריך פרסום</option>
              <option value="salary">שכר</option>
              <option value="title">כותרת</option>
              <option value="company">חברה</option>
            </select>
          </div>
          
          <div className="view-controls">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              רשימה
            </button>
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              כרטיסים
            </button>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>לא נמצאו משרות</h3>
          <p>נסה לשנות את מילות החיפוש או המסננים</p>
        </div>
      ) : (
        <div className={`jobs-container ${viewMode}`}>
          {sortedJobs.map((job) => (
            <div key={job.JobID} className="job-card">
              <div className="job-header">
                <div className="job-title-section">
                  <h3 className="job-title">{job.JobTitle}</h3>
                  <div className="job-meta">
                    <span className="company-name">
                      {job.CompanyName || 'חברה לא צוינה'}
                    </span>
                    <span className="job-location">📍 {job.CityName}</span>
                    <span className="job-date">🕒 {formatDate(job.CreatedAt)}</span>
                  </div>
                </div>
                
                <div className="job-salary">
                  <span className="salary-label">שכר:</span>
                  <span className="salary-amount">{formatSalary(job.Salary)}</span>
                </div>
              </div>

              <div className="job-content">
                <div className="job-description">
                  <p>{job.Description?.substring(0, 200)}...</p>
                </div>
                
                <div className="job-tags">
                  {job.JobType && (
                    <span className="job-tag job-type">{job.JobType}</span>
                  )}
                  {job.ExperienceLevel && (
                    <span className="job-tag experience">{job.ExperienceLevel}</span>
                  )}
                  {job.Category && (
                    <span className="job-tag category">{job.Category}</span>
                  )}
                  {job.remote_work && (
                    <span className="job-tag remote">עבודה מרחוק</span>
                  )}
                </div>
              </div>

              <div className="job-actions">
                {/* File input for uploading CV specific to this job */}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, job.JobID)}
                  className="cv-upload-input"
                />
                <button 
                  className="apply-btn"
                  onClick={() => handleApplyJob(job.JobID)}
                >
                  הגש מועמדות
                </button>
                <button className="save-btn">💾 שמור</button>
                <button className="share-btn">📤 שתף</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobResults;
