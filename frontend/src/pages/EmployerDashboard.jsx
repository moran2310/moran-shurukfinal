import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';
import './EmployerDashboard.css';

const EmployerDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [profileData, setProfileData] = useState({
    company_name: '',
    company_description: '',
    industry: '',
    company_size: '',
    website: '',
    phone: '',
    address: '',
    logo_file: ''
  });
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    requirements: '',
    salary_min: '',
    salary_max: '',
    location: '',
    job_type: '',
    category: ''
  });

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch user profile
    fetchProfile();
    fetchJobs();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        if (data.profile) {
          setProfileData(data.profile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/employer/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/employer/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        alert('פרופיל חברה נשמר בהצלחה!');
        setShowProfileForm(false);
        fetchProfile();
      } else {
        alert('שגיאה בשמירת הפרופיל');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('שגיאה בחיבור לשרת');
    }
  };

  const handleJobChange = (e) => {
    setJobData({
      ...jobData,
      [e.target.name]: e.target.value
    });
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/employer/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        alert('משרה פורסמה בהצלחה!');
        setShowJobForm(false);
        setJobData({
          title: '',
          description: '',
          requirements: '',
          salary_min: '',
          salary_max: '',
          location: '',
          job_type: '',
          category: ''
        });
        fetchJobs();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'שגיאה בפרסום המשרה');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      alert('שגיאה בחיבור לשרת');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="employer-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/" className="home-link">🏠 דף הבית</Link>
            <h1>לוח בקרה - מעסיק</h1>
          </div>
          <div className="user-info">
            <span>שלום, {user?.fullName}</span>
            <button onClick={handleLogout} className="logout-btn">התנתק</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="profile-section">
            <h3>פרופיל החברה</h3>
            {profile ? (
              <div className="profile-info">
                <p><strong>שם החברה:</strong> {profile.company_name || 'לא הוזן'}</p>
                <p><strong>תעשייה:</strong> {profile.industry || 'לא הוזנה'}</p>
                <p><strong>גודל החברה:</strong> {profile.company_size || 'לא הוזן'}</p>
                <p><strong>אתר:</strong> {profile.website || 'לא הוזן'}</p>
                <p><strong>טלפון:</strong> {profile.phone || 'לא הוזן'}</p>
                <button 
                  onClick={() => setShowProfileForm(true)}
                  className="edit-profile-btn"
                >
                  ערוך פרופיל חברה
                </button>
              </div>
            ) : (
              <div className="no-profile">
                <p>לא נמצא פרופיל חברה</p>
                <button 
                  onClick={() => setShowProfileForm(true)}
                  className="create-profile-btn"
                >
                  צור פרופיל חברה
                </button>
              </div>
            )}
          </div>

          <div className="quick-actions">
            <h3>פעולות מהירות</h3>
            <button 
              className="action-btn"
              onClick={() => setShowJobForm(true)}
            >
              פרסם משרה חדשה
            </button>
            <button className="action-btn">נהל מועמדים</button>
            <button className="action-btn">הודעות</button>
            <button className="action-btn">דוחות</button>
          </div>
        </div>

        <div className="main-content">
          <div className="stats-section">
            <h2>סטטיסטיקות</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>משרות פעילות</h3>
                <div className="stat-number">0</div>
              </div>
              <div className="stat-card">
                <h3>מועמדים השבוע</h3>
                <div className="stat-number">0</div>
              </div>
              <div className="stat-card">
                <h3>צפיות במשרות</h3>
                <div className="stat-number">0</div>
              </div>
              <div className="stat-card">
                <h3>משרות שמולאו</h3>
                <div className="stat-number">0</div>
              </div>
            </div>
          </div>

          <div className="posted-jobs">
            <h2>המשרות שפרסמת ({jobs.length})</h2>
            <div className="jobs-list">
              {jobs.length > 0 ? (
                jobs.map(job => (
                  <div key={job.id} className="job-card">
                    <div className="job-header">
                      <h3>{job.title}</h3>
                      <span className={`job-status ${job.status}`}>{job.status === 'active' ? 'פעילה' : 'סגורה'}</span>
                    </div>
                    <p className="job-location">{job.location}</p>
                    <p className="job-type">{job.job_type} | {job.category}</p>
                    {job.salary_min && job.salary_max && (
                      <p className="job-salary">₪{job.salary_min.toLocaleString()} - ₪{job.salary_max.toLocaleString()}</p>
                    )}
                    <p className="job-applications">{job.application_count || 0} מועמדויות</p>
                    <div className="job-actions">
                      <button className="view-btn">צפה במועמדים</button>
                      <button className="edit-btn">ערוך</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-jobs">
                  <p>עדיין לא פרסמת משרות</p>
                  <p className="post-first-job-text" onClick={() => setShowJobForm(true)}>
                    פרסם את המשרה הראשונה שלך
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showProfileForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>עריכת פרופיל חברה</h2>
              <button 
                onClick={() => setShowProfileForm(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label>שם החברה:</label>
                <input
                  type="text"
                  name="company_name"
                  value={profileData.company_name}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>תיאור החברה:</label>
                <textarea
                  name="company_description"
                  value={profileData.company_description}
                  onChange={handleProfileChange}
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>תעשייה:</label>
                <input
                  type="text"
                  name="industry"
                  value={profileData.industry}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>גודל החברה:</label>
                <select
                  name="company_size"
                  value={profileData.company_size}
                  onChange={handleProfileChange}
                >
                  <option value="">בחר גודל חברה</option>
                  <option value="1-10">1-10 עובדים</option>
                  <option value="11-50">11-50 עובדים</option>
                  <option value="51-200">51-200 עובדים</option>
                  <option value="201-500">201-500 עובדים</option>
                  <option value="500+">מעל 500 עובדים</option>
                </select>
              </div>
              <div className="form-group">
                <label>אתר אינטרנט:</label>
                <input
                  type="url"
                  name="website"
                  value={profileData.website}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>טלפון:</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>כתובת:</label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">שמור</button>
                <button 
                  type="button" 
                  onClick={() => setShowProfileForm(false)}
                  className="cancel-btn"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJobForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>פרסום משרה חדשה</h2>
              <button 
                onClick={() => setShowJobForm(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleJobSubmit} className="job-form">
              <div className="form-group">
                <label>כותרת המשרה:</label>
                <input
                  type="text"
                  name="title"
                  value={jobData.title}
                  onChange={handleJobChange}
                  required
                  placeholder="למשל: מפתח Full Stack"
                />
              </div>
              <div className="form-group">
                <label>תיאור המשרה:</label>
                <textarea
                  name="description"
                  value={jobData.description}
                  onChange={handleJobChange}
                  rows="4"
                  required
                  placeholder="תאר את המשרה, התפקידים והאחריות"
                />
              </div>
              <div className="form-group">
                <label>דרישות המשרה:</label>
                <textarea
                  name="requirements"
                  value={jobData.requirements}
                  onChange={handleJobChange}
                  rows="3"
                  placeholder="ניסיון, השכלה, כישורים נדרשים"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>שכר מינימום:</label>
                  <input
                    type="number"
                    name="salary_min"
                    value={jobData.salary_min}
                    onChange={handleJobChange}
                    placeholder="8000"
                  />
                </div>
                <div className="form-group">
                  <label>שכר מקסימום:</label>
                  <input
                    type="number"
                    name="salary_max"
                    value={jobData.salary_max}
                    onChange={handleJobChange}
                    placeholder="15000"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>מיקום:</label>
                <input
                  type="text"
                  name="location"
                  value={jobData.location}
                  onChange={handleJobChange}
                  required
                  placeholder="תל אביב, חיפה, עבודה מהבית"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>סוג המשרה:</label>
                  <select
                    name="job_type"
                    value={jobData.job_type}
                    onChange={handleJobChange}
                    required
                  >
                    <option value="">בחר סוג משרה</option>
                    <option value="משרה מלאה">משרה מלאה</option>
                    <option value="משרה חלקית">משרה חלקית</option>
                    <option value="פרילנס">פרילנס</option>
                    <option value="התמחות">התמחות</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>קטגוריה:</label>
                  <select
                    name="category"
                    value={jobData.category}
                    onChange={handleJobChange}
                    required
                  >
                    <option value="">בחר קטגוריה</option>
                    <option value="הייטק">הייטק</option>
                    <option value="שיווק ומכירות">שיווק ומכירות</option>
                    <option value="כספים וחשבונאות">כספים וחשבונאות</option>
                    <option value="משאבי אנוש">משאבי אנוש</option>
                    <option value="עיצוב">עיצוב</option>
                    <option value="ניהול">ניהול</option>
                    <option value="אחר">אחר</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">פרסם משרה</button>
                <button 
                  type="button" 
                  onClick={() => setShowJobForm(false)}
                  className="cancel-btn"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
