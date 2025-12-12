import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import './ApplicationsView.css';

const ApplicationsView = ({ userRole }) => {
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const endpoint = userRole === 'admin' 
        ? `${API_BASE_URL}/api/admin/jobs`
        : `${API_BASE_URL}/api/employer/jobs`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async (jobId) => {
    setLoading(true);
    try {
      const endpoint = userRole === 'admin'
        ? `${API_BASE_URL}/api/admin/jobs/${jobId}/applications`
        : `${API_BASE_URL}/api/employer/jobs/${jobId}/applications`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    fetchApplications(job.id || job.JobID);
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employer/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh applications
        fetchApplications(selectedJob.id || selectedJob.JobID);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const downloadCV = (cvPath) => {
    if (cvPath) {
      const filename = cvPath.split('/').pop();
      window.open(`${API_BASE_URL}/api/download-cv/${filename}`, '_blank');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'accepted': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'in_review': return '#ff9800';
      default: return '#2196f3';
    }
  };

  return (
    <div className="applications-view-container">
      <div className="applications-header">
        <h2>ניהול מועמדויות</h2>
        <p>בחר משרה כדי לראות את המועמדים</p>
      </div>

      <div className="applications-content">
        <div className="jobs-sidebar">
          <h3>משרות פעילות</h3>
          <div className="jobs-list">
            {jobs.map(job => (
              <div 
                key={job.id || job.JobID}
                className={`job-item ${selectedJob?.id === job.id ? 'active' : ''}`}
                onClick={() => handleJobSelect(job)}
              >
                <h4>{job.title || job.JobTitle}</h4>
                <p>{job.company_name || job.CompanyName}</p>
                <span className="applications-count">
                  {job.applications_count || 0} מועמדים
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="applications-main">
          {selectedJob ? (
            <>
              <div className="selected-job-header">
                <h3>{selectedJob.title || selectedJob.JobTitle}</h3>
                <p>{selectedJob.company_name || selectedJob.CompanyName} • {selectedJob.location || selectedJob.CityName}</p>
              </div>

              {loading ? (
                <div className="loading">טוען מועמדים...</div>
              ) : applications.length > 0 ? (
                <div className="applications-grid">
                  {applications.map(app => (
                    <div key={app.id} className="application-card">
                      <div className="applicant-header">
                        <div className="applicant-info">
                          <h4>{app.full_name}</h4>
                          <p>{app.email}</p>
                          {app.phone && <p>📞 {app.phone}</p>}
                        </div>
                        <div 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(app.status) }}
                        >
                          {app.status === 'pending' && 'ממתין'}
                          {app.status === 'accepted' && 'התקבל'}
                          {app.status === 'rejected' && 'נדחה'}
                          {app.status === 'in_review' && 'בבדיקה'}
                        </div>
                      </div>

                      <div className="applicant-details">
                        {app.skills && (
                          <div className="detail-row">
                            <strong>כישורים:</strong> {app.skills}
                          </div>
                        )}
                        {app.experience_years && (
                          <div className="detail-row">
                            <strong>ניסיון:</strong> {app.experience_years} שנים
                          </div>
                        )}
                        {app.education && (
                          <div className="detail-row">
                            <strong>השכלה:</strong> {app.education}
                          </div>
                        )}
                        <div className="detail-row">
                          <strong>תאריך הגשה:</strong> {new Date(app.applied_at).toLocaleDateString('he-IL')}
                        </div>
                      </div>

                      {app.cover_letter && (
                        <div className="cover-letter">
                          <strong>מכתב מקדים:</strong>
                          <p>{app.cover_letter}</p>
                        </div>
                      )}

                      <div className="application-actions">
                        {(app.application_cv || app.cv_file) && (
                          <button 
                            className="btn-download-cv"
                            onClick={() => downloadCV(app.application_cv || app.cv_file)}
                          >
                            📄 הורד קורות חיים
                          </button>
                        )}
                        
                        {userRole === 'employer' && (
                          <div className="status-actions">
                            <button 
                              className="btn-accept"
                              onClick={() => updateApplicationStatus(app.id, 'accepted')}
                              disabled={app.status === 'accepted'}
                            >
                              ✅ קבל
                            </button>
                            <button 
                              className="btn-review"
                              onClick={() => updateApplicationStatus(app.id, 'in_review')}
                              disabled={app.status === 'in_review'}
                            >
                              👁️ בבדיקה
                            </button>
                            <button 
                              className="btn-reject"
                              onClick={() => updateApplicationStatus(app.id, 'rejected')}
                              disabled={app.status === 'rejected'}
                            >
                              ❌ דחה
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-applications">
                  <p>אין מועמדים למשרה זו עדיין</p>
                </div>
              )}
            </>
          ) : (
            <div className="no-job-selected">
              <h3>בחר משרה מהרשימה</h3>
              <p>לחץ על אחת המשרות ברשימה כדי לראות את המועמדים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsView;
