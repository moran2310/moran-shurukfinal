import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JobApplicationModal from '../components/JobApplicationModal';
import { API_BASE_URL } from '../config';
import './JobDetails.css';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    checkApplicationStatus();
    fetchUserProfile();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const jobData = await response.json();
      setJob(jobData);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('שגיאה בטעינת פרטי המשרה');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/worker/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const checkApplicationStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/worker/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const applications = await response.json();
        const existingApplication = applications.find(app => app.job_id === parseInt(id));
        if (existingApplication) {
          setHasApplied(true);
          setApplicationStatus(existingApplication.status);
        }
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const handleApply = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('יש להתחבר כדי להגיש מועמדות');
      navigate('/login');
      return;
    }
    setShowApplicationModal(true);
  };

  const handleApplicationSubmit = async ({ cvFile, useExistingCV, coverLetter, jobId }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('יש להתחבר כדי להגיש מועמדות');
    }

    const formData = new FormData();
    if (useExistingCV) {
      // Don't append CV file, backend will use existing CV from profile
      formData.append('useExistingCV', 'true');
    } else if (cvFile) {
      formData.append('cv', cvFile);
    }
    formData.append('coverLetter', coverLetter);

    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply-with-cv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'שגיאה בהגשת המועמדות');
    }

    const result = await response.json();
    setHasApplied(true);
    setApplicationStatus('pending');
    setShowApplicationModal(false);
    alert(result.message || 'המועמדות הוגשה בהצלחה!');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="job-details-container">
        <div className="loading">טוען פרטי משרה...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-details-container">
        <div className="error-message">{error}</div>
        <button onClick={handleGoBack} className="back-button">
          חזור לתוצאות החיפוש
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-details-container">
        <div className="error-message">משרה לא נמצאה</div>
        <button onClick={handleGoBack} className="back-button">
          חזור לתוצאות החיפוש
        </button>
      </div>
    );
  }

  return (
    <div className="job-details-container">
      <div className="job-details-header">
        <button onClick={handleGoBack} className="back-button">
          ← חזור לתוצאות
        </button>
        <h1>פרטי המשרה</h1>
      </div>

      <div className="job-details-content">
        <div className="job-header">
          <h2 className="job-title">{job.JobTitle}</h2>
          <div className="job-meta">
            <span className="company-name">{job.CompanyName}</span>
            <span className="job-location">{job.CityName}</span>
            {job.Salary && <span className="job-salary">{job.Salary}</span>}
          </div>
        </div>

        <div className="job-sections">
          <div className="job-section">
            <h3>תיאור המשרה</h3>
            <div className="job-description">
              {job.Description ? (
                <p>{job.Description}</p>
              ) : (
                <p>אין תיאור זמין למשרה זו</p>
              )}
            </div>
          </div>

          {job.Requirements && (
            <div className="job-section">
              <h3>דרישות התפקיד</h3>
              <div className="job-requirements">
                <p>{job.Requirements}</p>
              </div>
            </div>
          )}

          <div className="job-section">
            <h3>פרטים נוספים</h3>
            <div className="job-additional-info">
              <div className="info-item">
                <strong>סטטוס המשרה:</strong> {job.Status === 'open' ? 'פתוחה' : 'סגורה'}
              </div>
              <div className="info-item">
                <strong>תאריך פרסום:</strong> {new Date(job.CreatedAt).toLocaleDateString('he-IL')}
              </div>
              {job.Salary && (
                <div className="info-item">
                  <strong>שכר:</strong> {job.Salary}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="job-actions">
          {hasApplied ? (
            <div className="application-status">
              <span className="status-badge">
                {applicationStatus === 'pending' && '⏳ המועמדות בבדיקה'}
                {applicationStatus === 'accepted' && '✅ המועמדות התקבלה'}
                {applicationStatus === 'rejected' && '❌ המועמדות נדחתה'}
                {applicationStatus === 'in_review' && '👀 המועמדות בסקירה'}
              </span>
            </div>
          ) : (
            <button 
              onClick={handleApply} 
              className="apply-button"
              disabled={job.Status !== 'open'}
            >
              {job.Status === 'open' ? 'הגש מועמדות' : 'המשרה סגורה'}
            </button>
          )}
          <button onClick={handleGoBack} className="back-button-secondary">
            חזור לחיפוש
          </button>
        </div>
      </div>

      <JobApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        jobDetails={job}
        userProfile={userProfile}
        onSubmit={handleApplicationSubmit}
      />
    </div>
  );
};

export default JobDetails;
