import React, { useState, useEffect } from 'react';
import './EmployerApplicationDashboard.css';

const EmployerApplicationDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationLoading, setApplicationLoading] = useState(false);

  useEffect(() => {
    fetchEmployerJobs();
  }, []);

  const fetchEmployerJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employer/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApplications = async (jobId) => {
    setApplicationLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employer/jobs/${jobId}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setApplicationLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employer/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        // Refresh applications
        if (selectedJob) {
          fetchJobApplications(selectedJob.id);
        }
        alert('סטטוס המועמדות עודכן בהצלחה!');
      } else {
        const error = await response.json();
        alert(error.error || 'שגיאה בעדכון סטטוס');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('שגיאה בעדכון סטטוס');
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    fetchJobApplications(job.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'in_review': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'accepted': return 'התקבל';
      case 'rejected': return 'נדחה';
      case 'in_review': return 'בבדיקה';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="employer-application-dashboard">
      <div className="dashboard-header">
        <h2>ניהול מועמדויות</h2>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-number">{jobs.length}</span>
            <span className="stat-label">משרות פעילות</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {jobs.reduce((sum, job) => sum + (job.application_count || 0), 0)}
            </span>
            <span className="stat-label">סה"כ מועמדויות</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {jobs.reduce((sum, job) => sum + (job.pending_applications || 0), 0)}
            </span>
            <span className="stat-label">ממתינות לבדיקה</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="jobs-panel">
          <h3>המשרות שלי</h3>
          <div className="jobs-list">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className={`job-item ${selectedJob?.id === job.id ? 'selected' : ''}`}
                onClick={() => handleJobSelect(job)}
              >
                <div className="job-info">
                  <h4>{job.title}</h4>
                  <p className="job-meta">{job.location} • {formatDate(job.created_at)}</p>
                </div>
                <div className="job-stats">
                  <div className="stat">
                    <span className="count">{job.application_count || 0}</span>
                    <span className="label">מועמדויות</span>
                  </div>
                  <div className="stat pending">
                    <span className="count">{job.pending_applications || 0}</span>
                    <span className="label">ממתינות</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="applications-panel">
          {selectedJob ? (
            <>
              <div className="panel-header">
                <h3>מועמדויות ל: {selectedJob.title}</h3>
                <div className="application-stats">
                  <span className="total">סה"כ: {applications.length}</span>
                  <span className="pending">
                    ממתינות: {applications.filter(app => app.status === 'pending').length}
                  </span>
                </div>
              </div>

              {applicationLoading ? (
                <div className="applications-loading">
                  <div className="spinner"></div>
                  <p>טוען מועמדויות...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="no-applications">
                  <div className="no-applications-icon">📝</div>
                  <h4>אין מועמדויות</h4>
                  <p>עדיין לא הוגשו מועמדויות למשרה זו</p>
                </div>
              ) : (
                <div className="applications-list">
                  {applications.map((application) => (
                    <div key={application.id} className="application-card">
                      <div className="application-header">
                        <div className="candidate-info">
                          <h4>{application.full_name}</h4>
                          <p className="candidate-email">{application.email}</p>
                          {application.phone && (
                            <p className="candidate-phone">📞 {application.phone}</p>
                          )}
                        </div>
                        <div 
                          className="application-status"
                          style={{ backgroundColor: getStatusColor(application.status) }}
                        >
                          {getStatusText(application.status)}
                        </div>
                      </div>

                      <div className="application-details">
                        {application.experience_years && (
                          <div className="detail-item">
                            <span className="label">ניסיון:</span>
                            <span className="value">{application.experience_years} שנים</span>
                          </div>
                        )}
                        {application.education && (
                          <div className="detail-item">
                            <span className="label">השכלה:</span>
                            <span className="value">{application.education}</span>
                          </div>
                        )}
                        {application.skills && (
                          <div className="detail-item">
                            <span className="label">כישורים:</span>
                            <span className="value">{application.skills}</span>
                          </div>
                        )}
                        <div className="detail-item">
                          <span className="label">הגיש ב:</span>
                          <span className="value">{formatDate(application.applied_at)}</span>
                        </div>
                      </div>

                      {application.cv_file && (
                        <div className="cv-section">
                          <a 
                            href={`/api/download-cv/${application.cv_file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cv-link"
                          >
                            📄 הורד קורות חיים
                          </a>
                        </div>
                      )}

                      <div className="application-actions">
                        {application.status === 'pending' && (
                          <>
                            <button 
                              className="action-btn review"
                              onClick={() => updateApplicationStatus(application.id, 'in_review')}
                            >
                              העבר לבדיקה
                            </button>
                            <button 
                              className="action-btn accept"
                              onClick={() => updateApplicationStatus(application.id, 'accepted')}
                            >
                              קבל
                            </button>
                            <button 
                              className="action-btn reject"
                              onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            >
                              דחה
                            </button>
                          </>
                        )}
                        {application.status === 'in_review' && (
                          <>
                            <button 
                              className="action-btn accept"
                              onClick={() => updateApplicationStatus(application.id, 'accepted')}
                            >
                              קבל
                            </button>
                            <button 
                              className="action-btn reject"
                              onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            >
                              דחה
                            </button>
                          </>
                        )}
                        {(application.status === 'accepted' || application.status === 'rejected') && (
                          <button 
                            className="action-btn reset"
                            onClick={() => updateApplicationStatus(application.id, 'pending')}
                          >
                            החזר לממתין
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-job-selected">
              <div className="no-job-icon">👈</div>
              <h3>בחר משרה</h3>
              <p>בחר משרה מהרשימה כדי לצפות במועמדויות</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerApplicationDashboard;
