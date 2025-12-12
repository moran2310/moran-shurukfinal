import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotification } from '../contexts/NotificationContext';
import ReportForm from '../components/worker/ReportForm';
import WorkerQuickActions from '../components/worker/WorkerQuickActions';
import './WorkerDashboard.css';
import './EnhancedWorkerDashboard.css';
import './ModernWorkerDashboard.css';
import '../components/worker/ReportForm.css';

// Import React Icons
import { 
  FaBriefcase, FaUserCircle, FaPaperPlane, FaCheckCircle,
  FaClock, FaBullseye, FaArrowUp, FaArrowDown, FaMinus, FaUser,
  FaEdit, FaDownload, FaSearch, FaFilter, FaBuilding,
  FaMapMarkerAlt, FaHeart, FaCheck, FaPercentage, FaPlus, FaPhone,
  FaGraduationCap, FaTag, FaMapMarkedAlt, FaShekelSign, FaTools,
  FaBell, FaSignOutAlt, FaStar, FaRocket, FaFileUpload, FaFileAlt,
  FaCog, FaHome, FaEnvelope, FaTrophy, FaAward,
  FaChartPie, FaUserTie, FaGem, FaThumbsUp, FaComments, FaShareAlt, FaBookmark,
  FaCalendarAlt, FaMoneyBillWave, FaUserGraduate, FaLaptopCode,
  FaPalette, FaBullhorn, FaCoins, FaIndustry, FaChartBar
} from 'react-icons/fa';
import { 
  BiSolidDashboard, BiTime, BiTrendingUp, BiTargetLock,
  BiStats, BiAnalyse, BiNetworkChart
} from 'react-icons/bi';
import { 
  MdDashboard, MdWork, MdLocationOn, MdEmail, MdNotifications,
  MdSettings, MdAnalytics, MdTrendingUp, MdWorkspaces,
  MdBusinessCenter, MdAssignment, MdDescription
} from 'react-icons/md';
import { 
  IoMdStats, IoMdTrophy, IoMdRocket, IoMdPulse 
} from 'react-icons/io';
import { 
  AiFillDashboard, AiFillStar, AiFillTrophy, AiFillFire 
} from 'react-icons/ai';
import { 
  HiOutlineSparkles, HiLightningBolt, HiTrendingUp 
} from 'react-icons/hi';
import { 
  RiDashboardFill, RiFileUploadLine, RiUserStarFill 
} from 'react-icons/ri';

const WorkerDashboard = () => {
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  
  // Helper function to get user name from various possible sources
  const getUserName = () => {
    // Check profile first (most complete data)
    if (profile?.full_name) return profile.full_name;
    
    // Check user object with various field names
    if (user?.full_name) return user.full_name;
    if (user?.fullName) return user.fullName;
    if (user?.name) return user.name;
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    
    // Fallback to email username if available
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'משתמש'; // Default fallback
  };

  const [user, setUser] = useState(null);
  const [stats] = useState({
    totalApplications: 0,
    activeJobs: 0,
    interviews: 0,
    status: 'searching'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [suggestedJobs, setSuggestedJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [cvFiles, setCvFiles] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; // Total number of pages in the form
  
  const [profileData, setProfileData] = useState({
    phone: '',
    address: '',
    skills: '',
    experience_years: '',
    education: '',
    preferred_job_type: '',
    preferred_location: '',
    salary_expectation: '',
    cv_file: ''
  });
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Reset to first page when opening the modal
  const openProfileForm = () => {
    setCurrentPage(1);
    setShowProfileForm(true);
  };
  
  const closeProfileForm = () => {
    setShowProfileForm(false);
    setCurrentPage(1); // Reset to first page when closing
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('suggested');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  // Category chips: 'all' | 'הייטק' | 'עיצוב' | 'שיווק' | 'כלכלה'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Time range filter for analytics cards: 'week' | 'month' | 'year'
  const [timeRange, setTimeRange] = useState('week');
  const [profile, setProfile] = useState(null);

  // Helpers to filter arrays by a date field and selected time range
  const getThresholdDate = (range) => {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    if (range === 'week') return new Date(now.getTime() - 7 * dayMs);
    if (range === 'month') return new Date(now.getTime() - 30 * dayMs);
    if (range === 'year') return new Date(now.getTime() - 365 * dayMs);
    return new Date(0);
  };

  const filterByTime = (items, field, range) => {
    const threshold = getThresholdDate(range);
    return (items || []).filter((item) => {
      const raw = item?.[field] || item?.applied_at || item?.created_at || item?.updated_at;
      if (!raw) return false;
      const d = new Date(raw);
      return !isNaN(d.getTime()) && d >= threshold;
    });
  };

  // Memoized filtered datasets for analytics cards
  const filteredApplications = useMemo(
    () => filterByTime(applications, 'applied_at', timeRange),
    [applications, timeRange]
  );
  const filteredSuggestedJobs = useMemo(
    () => filterByTime(suggestedJobs, 'created_at', timeRange),
    [suggestedJobs, timeRange]
  );

  // Analytics calculations
  const successRate = useMemo(() => {
    const accepted = filteredApplications.filter((a) => a.status === 'accepted').length;
    return filteredApplications.length > 0 ? Math.round((accepted / filteredApplications.length) * 100) : 0;
  }, [filteredApplications]);

  const inReviewCount = useMemo(
    () => filteredApplications.filter((a) => a.status === 'in_review' || a.status === 'pending').length,
    [filteredApplications]
  );

  const acceptedCount = useMemo(
    () => filteredApplications.filter((a) => a.status === 'accepted').length,
    [filteredApplications]
  );

  const rejectedCount = useMemo(
    () => filteredApplications.filter((a) => a.status === 'rejected').length,
    [filteredApplications]
  );

  const responseRate = useMemo(() => {
    const responded = filteredApplications.filter((a) => 
      a.status === 'accepted' || a.status === 'rejected' || a.status === 'in_review'
    ).length;
    return filteredApplications.length > 0 ? Math.round((responded / filteredApplications.length) * 100) : 0;
  }, [filteredApplications]);

  const averageResponseTime = useMemo(() => {
    const respondedApps = filteredApplications.filter((a) => 
      a.status !== 'pending' && a.updated_at && a.applied_at
    );
    
    if (respondedApps.length === 0) return 0;
    
    const totalDays = respondedApps.reduce((sum, app) => {
      const applied = new Date(app.applied_at);
      const updated = new Date(app.updated_at);
      const diffTime = Math.abs(updated - applied);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return Math.round(totalDays / respondedApps.length);
  }, [filteredApplications]);

  // WebSocket is optional - only connect if available
  const { data: wsData, error: wsError, isConnected } = useWebSocket(null); // Disabled for now to avoid errors

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('User data from localStorage:', parsedUser);
      setUser(parsedUser);
    }

    fetchProfile();
    fetchSuggestedJobs();
    fetchAllJobs();
    fetchApplications();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/worker/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        console.log('Current user data:', user);
        setProfile(data);
        
        setProfileData({
          phone: data.phone || '',
          address: data.address || '',
          skills: data.skills || '',
          experience_years: data.experience_years || '',
          education: data.education || '',
          preferred_job_type: data.preferred_job_type || '',
          preferred_location: data.preferred_location || '',
          salary_expectation: data.salary_expectation || '',
          cv_file: data.cv_file || ''
        });
        
        console.log('Profile data set, user name should be:', data.full_name || 'Not found in profile');
      } else {
        console.log('Profile fetch failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSuggestedJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/jobs/suggested`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedJobs(data);
      }
    } catch (error) {
      console.error('Error fetching suggested jobs:', error);
    }
  };

  const fetchAllJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      // First try to fetch all jobs including inactive ones from the admin endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs?include_inactive=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllJobs(data);
      } else if (response.status === 403) {
        // If not authorized (not an admin), fall back to the public endpoint
        console.log('Not authorized to view all jobs, falling back to public endpoint');
        const publicResponse = await fetch(`${API_BASE_URL}/api/jobs`);
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          setAllJobs(publicData);
        }
      }
    } catch (error) {
      console.error('Error fetching all jobs:', error);
      // Fallback to public endpoint if there's an error
      try {
        const publicResponse = await fetch(`${API_BASE_URL}/api/jobs`);
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          setAllJobs(publicData);
        }
      } catch (fallbackError) {
        console.error('Error fetching jobs from fallback endpoint:', fallbackError);
      }
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/worker/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleJobApplication = async (jobId) => {
    const file = cvFiles[jobId];
    if (!file) {
      showWarning('אנא העלה קובץ קורות חיים לפני הגשת המועמדות', 'חסר קובץ קורות חיים');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('cv', file);
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload-cv`, {
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
      const applyRes = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const applyData = await applyRes.json().catch(() => ({}));
      if (!applyRes.ok) {
        throw new Error(applyData.error || applyData.message || 'שגיאה בהגשת המועמדות');
      }
      showSuccess('מועמדותך הוגשה בהצלחה ותישלח לבדיקת המעסיק', 'מועמדות הוגשה!');
      setCvFiles(prev => {
        const copy = { ...prev };
        delete copy[jobId];
        return copy;
      });
      fetchApplications();
    } catch (error) {
      console.error('Error applying for job:', error);
      showError(error.message || 'שגיאה בחיבור לשרת', 'שגיאה בהגשת מועמדות');
    }
  };

  const handleFileChange = (e, jobId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setCvFiles(prev => ({ ...prev, [jobId]: file }));
  };

  const isJobApplied = (jobId) => {
    return applications.some(app => app.job_id === jobId);
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        showError('לא נמצא אסימון הרשאה. יש להתחבר מחדש.', 'שגיאת הרשאה');
        return;
      }

      // Check if there's a CV file to upload
      const cvFile = cvFiles['cv'];
      
      if (cvFile) {
        try {
          // Create FormData and append the file
          const formData = new FormData();
          formData.append('cv', cvFile);
          
          // Try to upload the CV file
          const cvResponse = await fetch(`${API_BASE_URL}/api/worker/upload-cv`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
              // Don't set Content-Type header, let the browser set it with the correct boundary
            },
            body: formData
          });
          
          if (!cvResponse.ok) {
            const errorData = await cvResponse.json().catch(() => ({}));
            console.error('CV upload error:', errorData);
            throw new Error(errorData.message || 'שגיאה בהעלאת קובץ CV. אנא נסה שוב מאוחר יותר.');
          }
          
          const cvData = await cvResponse.json();
          if (cvData.path) {
            profileData.cv_file = cvData.path;
          }
        } catch (error) {
          console.error('CV upload failed:', error);
          // Continue with profile update even if CV upload fails
          showWarning('לא ניתן היה להעלות את קובץ ה-CV. תוכל לנסות להעלות אותו שוב מאוחר יותר.', 'שגיאה בהעלאת קובץ');
        }
      }

      // Send only non-empty fields so backend does a partial update
      const payload = Object.fromEntries(
        Object.entries(profileData).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );

      const response = await fetch(`${API_BASE_URL}/api/worker/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        showError('ההרשאה שלך פגה. יש להתחבר מחדש.', 'הרשאה פגה');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'שגיאה בשמירת הפרופיל');
      }

      showSuccess('הפרופיל שלך נשמר בהצלחה ועודכן במערכת', 'פרופיל נשמר!');
      setShowProfileForm(false);
      setCvFiles({}); // Clear CV files after successful upload
      fetchProfile();
      fetchSuggestedJobs();
      fetchAllJobs();
      fetchApplications();
    } catch (error) {
      console.error('Error saving profile:', error);
      showError(error.message || 'שגיאה בחיבור לשרת', 'שגיאה בשמירת פרופיל');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Search functionality is handled directly in the search input onChange

  const getFilteredJobs = () => {
    let result = [];

    // First filter by active tab
    if (activeTab === 'suggested') {
      result = [...suggestedJobs];
    } else if (activeTab === 'all') {
      result = [...allJobs];
    } else if (activeTab === 'applied') {
      result = [...applications];
    }

    // Then filter by search term if one exists
    if (searchTerm.trim() !== '') {
      const lowercasedFilter = searchTerm.toLowerCase();
      result = result.filter(job =>
        (job.title && job.title.toLowerCase().includes(lowercasedFilter)) ||
        (job.company_name && job.company_name.toLowerCase().includes(lowercasedFilter)) ||
        (job.location && job.location.toLowerCase().includes(lowercasedFilter)) ||
        (job.description && job.description.toLowerCase().includes(lowercasedFilter))
      );
    }

    // Category chip filtering
    if (selectedCategory !== 'all') {
      const keywordMap = {
        'הייטק': ['הייטק', 'טכנולוגיה', 'תוכנה', 'מפתח', 'מתכנת', 'פיתוח', 'dev', 'software', 'qa', 'data', 'frontend', 'backend', 'fullstack', 'מהנדס'],
        'עיצוב': ['עיצוב', 'designer', 'ux', 'ui', 'product design', 'גרפי', 'עיצוב מוצר'],
        'שיווק': ['שיווק', 'marketing', 'seo', 'sem', 'ppc', 'social', 'content', 'campaign', 'sales'],
        'כלכלה': ['כלכלה', 'finance', 'חשבונאות', 'accounting', 'אנליסט', 'analyst', 'controller', 'bookkeeper']
      };
      const selectedKeywords = keywordMap[selectedCategory] || [selectedCategory];
      result = result.filter(job => {
        const text = [job.category, job.job_type, job.title, job.description]
          .map(v => (v || '').toString().toLowerCase())
          .join(' ');
        return selectedKeywords.some(k => text.includes(k.toLowerCase()));
      });
    }

    return result;
  };

  return (
    <div className="worker-dashboard">
      {/* Home Button */}
      <div className="dashboard-header">
        <Link to="/" className="home-button">
          <FaHome className="me-2" />
          דף הבית
        </Link>
      </div>
      {/* Modern Header */}
      <header className="modern-header enhanced-header">
        <div className="header-wrapper">
          <div className="brand-section">
            <div className="brand-icon animated-icon">
              <MdDashboard className="icon-3d" />
            </div>
            <div className="brand-text">
              <h1><HiOutlineSparkles className="sparkle-icon" /> לוח בקרה</h1>
              <span><FaRocket className="small-icon" /> מערכת ניהול קריירה חכמה</span>
            </div>
          </div>
          
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar gradient-avatar">
                <FaUserCircle className="avatar-icon" />
              </div>
              <div className="user-details">
                <span className="user-name">{getUserName()}</span>
                <span className="user-role"><FaStar className="small-icon gold" /> מועמד פעיל</span>
              </div>
            </div>
            <div className="header-actions">
              <button className="header-btn notification-btn">
                <FaBell className="icon-animated" />
                <span className="notification-badge">3</span>
              </button>
              <button className="header-btn settings-btn" onClick={() => setShowProfileForm(true)}>
                <MdSettings className="icon-spin" />
              </button>
              <button 
                className="logout-button-new" 
                onClick={handleLogout}
                title="התנתק מהמערכת"
              >
                <FaSignOutAlt className="logout-icon" />
                <span className="logout-text">התנתק</span>
              </button>
            </div>
          </div>
        </div>
      </header>




      {/* Main Dashboard Content */}
      <div className="dashboard-main">
        <div className="container">
          <div className="dashboard-grid">
            {/* Left Column - Profile & Quick Actions */}
            <div className="left-column">
              {/* Enhanced Profile Card */}
              <div className="profile-card-modern glass-card">
                <div className="profile-header-modern">
                  <div className="profile-avatar-modern gradient-bg">
                    <RiUserStarFill className="avatar-icon-large" />
                  </div>
                  <div className="profile-info">
                    <h3>{getUserName()}</h3>
                    <span className="profile-role"><FaBriefcase className="small-icon" /> {profile?.preferred_job_type || 'מחפש עבודה'}</span>
                    <div className="profile-status online">
                      <span className="status-dot"></span> פעיל עכשיו
                    </div>
                  </div>
                </div>
                
                <button className="action-btn-modern primary gradient-btn" style={{marginTop: '20px'}} onClick={openProfileForm}>
                  <FaEdit className="btn-icon" /> ערוך פרופיל
                </button>
                
                <WorkerQuickActions 
                  profile={profile}
                  onProfileUpdate={fetchProfile}
                  showSuccess={showSuccess}
                  showError={showError}
                />
              </div>
              

              
            </div>
            
            {/* Right Column - Search & Jobs */}
            <div className="right-column">
              {/* Advanced Search */}
              <div className="search-card-modern glass-card">
                <div className="search-header">
                  <h3><FaSearch className="section-icon" /> חיפוש מתקדם</h3>
                </div>
                <div className="search-form">
                  <div className="search-row">
                    <div className="search-field">
                      <input 
                        type="text" 
                        placeholder="מה אתם מחפשים?"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-modern glass-input"
                      />
                      <FaSearch className="search-icon" />
                    </div>
                    <button className="search-btn-modern gradient-btn">
                      <FaFilter className="btn-icon" /> סננים
                    </button>
                  </div>
                  
                  <div className="filter-tags">
                    {[
                      { key: 'all', label: 'כל המשרות', icon: <MdWorkspaces /> },
                      { key: 'הייטק', label: 'הייטק', icon: <FaLaptopCode /> },
                      { key: 'עיצוב', label: 'עיצוב', icon: <FaPalette /> },
                      { key: 'שיווק', label: 'שיווק', icon: <FaBullhorn /> },
                      { key: 'כלכלה', label: 'כלכלה', icon: <FaCoins /> }
                    ].map(cat => (
                      <button
                        key={cat.key}
                        type="button"
                        className={`filter-tag glass-tag ${selectedCategory === cat.key ? 'active' : ''}`}
                        aria-pressed={selectedCategory === cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Jobs Grid */}
              <div className="jobs-section-modern">
                <div className="jobs-header">
                  <h3><MdBusinessCenter className="section-icon" /> משרות מומלצות</h3>
                  <div className="view-controls">
                    <button className="view-btn glass-btn active" onClick={() => setActiveTab('suggested')}>
                      <MdWorkspaces />
                    </button>
                    <button className="view-btn glass-btn" onClick={() => setActiveTab('all')}>
                      <MdAssignment />
                    </button>
                  </div>
                </div>
                
                <div className="jobs-grid-modern">
                  {getFilteredJobs().length === 0 ? (
                    <div className="empty-jobs glass-card">
                      <FaSearch className="empty-icon" />
                      <h4>לא נמצאו משרות</h4>
                      <p>נסה לשנות את מילות החיפוש</p>
                    </div>
                  ) : (
                    getFilteredJobs().slice(0, 6).map((job) => (
                      <div key={job.id} className="job-card-modern glass-card hover-lift">
                        <div className="job-header-modern">
                          <div className="company-logo gradient-bg">
                            <FaBuilding className="company-icon" />
                          </div>
                          <div className="job-meta">
                            <h4>{job.title}</h4>
                            <span className="company"><FaIndustry className="tiny-icon" /> {job.company_name}</span>
                            <span className="location">
                              <FaMapMarkerAlt className="tiny-icon" />
                              {job.location}
                            </span>
                          </div>
                          <div className="job-actions-modern">
                            <button className="save-job glass-btn">
                              <FaBookmark className="bookmark-icon" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="job-description-modern">
                          <p>{job.description?.substring(0, 120)}...</p>
                        </div>
                        
                        <div className="job-tags-modern">
                          <span className="job-tag glass-tag">
                            <MdWork className="tag-icon" />
                            {job.job_type || 'משרה'}
                          </span>
                          {job.salary_min && (
                            <span className="salary-tag glass-tag">
                              <FaMoneyBillWave className="tag-icon" />
                              {job.salary_min.toLocaleString()} ₪+
                            </span>
                          )}
                          <span className="time-tag glass-tag">
                            <FaCalendarAlt className="tag-icon" />
                            פורסם לפני 2 ימים
                          </span>
                        </div>
                        
                        <div className="job-footer-modern">
                          {applications.some(app => app.job_id === job.id) ? (
                            <div className="applied-badge success-badge">
                              <FaCheck className="badge-icon" /> הוגשה
                            </div>
                          ) : (
                            <button 
                              className="apply-btn-modern gradient-btn"
                              onClick={() => handleJobApplication(job.id)}
                            >
                              <FaPaperPlane className="btn-icon" /> הגש מועמדות
                            </button>
                          )}
                          <span className="match-score glass-badge">
                            <FaPercentage className="badge-icon" /> 85% התאמה
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {getFilteredJobs().length > 6 && (
                  <div className="load-more">
                    <button className="load-more-btn gradient-btn">
                      <FaPlus className="btn-icon" /> טען עוד משרות
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Issue Modal */}
      {showReportForm && (
        <div className="modal-overlay" onClick={() => setShowReportForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ReportForm
              onClose={() => setShowReportForm(false)}
              onSubmit={(reportData) => {
                console.log('Report submitted:', reportData);
              }}
            />
          </div>
        </div>
      )}
      

      {/* Modern Profile Form Modal */}
      {showProfileForm && (
        <div className="modal-overlay">
          <div className="modal-content profile-form-container">
            <div className="modal-header">
              <h2>עריכת פרטים אישיים</h2>
              <div className="page-indicator">
                {Array.from({ length: totalPages }, (_, i) => (
                  <div 
                    key={i} 
                    className={`page-dot ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  />
                ))}
              </div>
              <button className="close-btn" onClick={closeProfileForm}>×</button>
            </div>

            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-sections-container">
                {/* Page 1: Personal Information */}
                <div className="form-section" style={{ display: currentPage === 1 ? 'block' : 'none' }}>
                  <div className="section-header">
                    <i className="fas fa-user-circle"></i>
                    <h3>פרטים אישיים</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>טלפון</label>
                      <div className="input-with-icon">
                        <i className="fas fa-phone"></i>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone || ''}
                          onChange={handleProfileChange}
                          placeholder="הזן מספר טלפון"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>כתובת</label>
                      <div className="input-with-icon">
                        <i className="fas fa-map-marker-alt"></i>
                        <input
                          type="text"
                          name="address"
                          value={profileData.address || ''}
                          onChange={handleProfileChange}
                          placeholder="הזן כתובת מגורים"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 2: Professional Information */}
                <div className="form-section" style={{ display: currentPage === 2 ? 'block' : 'none' }}>
                  <div className="section-header">
                    <i className="fas fa-briefcase"></i>
                    <h3>מידע מקצועי</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>שנות ניסיון</label>
                      <div className="input-with-icon">
                        <i className="fas fa-chart-line"></i>
                        <input
                          type="number"
                          name="experience_years"
                          value={profileData.experience_years || ''}
                          onChange={handleProfileChange}
                          min="0"
                          placeholder="מספר שנות ניסיון"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>השכלה</label>
                      <div className="input-with-icon">
                        <i className="fas fa-graduation-cap"></i>
                        <input
                          type="text"
                          name="education"
                          value={profileData.education || ''}
                          onChange={handleProfileChange}
                          placeholder="תארים והכשרות"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>תחום מקצועי מועדף</label>
                      <div className="input-with-icon">
                        <i className="fas fa-tag"></i>
                        <input
                          type="text"
                          name="preferred_job_type"
                          value={profileData.preferred_job_type || ''}
                          onChange={handleProfileChange}
                          placeholder="למשל: פיתוח תוכנה, שיווק"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>אזור עבודה מועדף</label>
                      <div className="input-with-icon">
                        <i className="fas fa-map-marked-alt"></i>
                        <input
                          type="text"
                          name="preferred_location"
                          value={profileData.preferred_location || ''}
                          onChange={handleProfileChange}
                          placeholder="למשל: תל אביב, מרכז"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>שכר צפוי</label>
                      <div className="input-with-icon">
                        <i className="fas fa-shekel-sign"></i>
                        <input
                          type="number"
                          name="salary_expectation"
                          value={profileData.salary_expectation || ''}
                          onChange={handleProfileChange}
                          placeholder="שכר צפוי"
                        />
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>כישורים</label>
                      <div className="input-with-icon">
                        <i className="fas fa-tools"></i>
                        <input
                          type="text"
                          name="skills"
                          value={profileData.skills || ''}
                          onChange={handleProfileChange}
                          placeholder="הזן כישורים מופרדים בפסיקים"
                        />
                      </div>
                      <div className="help-text">הזן כישורים מופרדים בפסיקים (למשל: JavaScript, React, ניהול צוות)</div>
                    </div>
                  </div>
                </div>
                <div className="form-section" style={{ display: currentPage === 3 ? 'block' : 'none' }}>
                  <div className="section-header">
                    <i className="fas fa-file-alt"></i>
                    <h3>קורות חיים</h3>
                  </div>
                  <div className="form-group">
                    <label>העלאת קורות חיים (אופציונלי)</label>
                    <div className="file-upload-container">
                      <label className="file-upload-label">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <span>גרור קובץ לכאן או לחץ לבחירה</span>
                        <input
                          type="file"
                          name="cv_file"
                          onChange={(e) => handleFileChange(e, 'cv')}
                          accept=".pdf,.doc,.docx"
                          className="file-input"
                        />
                      </label>
                      {profileData.cv_file && (
                        <div className="file-preview">
                          <i className="fas fa-file-pdf"></i>
                          <span>{typeof profileData.cv_file === 'string' ? 'קובץ קיים' : profileData.cv_file.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-navigation">
                {currentPage > 1 && (
                  <button type="button" className="btn-prev" onClick={prevPage}>
                    ← הקודם
                  </button>
                )}
                
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={closeProfileForm}>
                    ביטול
                  </button>
                  {currentPage < totalPages ? (
                    <button type="button" className="btn-next" onClick={nextPage}>
                      הבא →
                    </button>
                  ) : (
                    <button type="submit" className="btn-submit">
                      שמור שינויים
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
