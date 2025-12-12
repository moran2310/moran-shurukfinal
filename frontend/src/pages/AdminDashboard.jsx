import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './AdminDashboard.css';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import CandidateManagement from '../components/admin/CandidateManagement';
import EmployerManagement from '../components/admin/EmployerManagement';
import JobManager from '../components/admin/JobManager';
import UserManagement from '../components/admin/UserManagement';
import ApplicationsView from '../components/admin/ApplicationsView';
import { useWebSocket } from '../hooks/useWebSocket';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('candidates');
  const [adminUser, setAdminUser] = useState(null);
  const [stats, setStats] = useState({
    activeCandidates: 0,
    activeJobs: 0,
    totalPlacements: 0,
    categoryStats: [],
    monthlyPlacements: [],
    departmentStats: [],
    placementRates: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // WebSocket connection for real-time updates
  // Determine the WebSocket URL from an environment variable.  If
  // REACT_APP_WEBSOCKET_URL is not defined, the hook will receive
  // `null` and skip establishing a connection (see useWebSocket.js).
  const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || null;
  const { data: wsData, error: wsError, isConnected } = useWebSocket(wsUrl);

  const fetchAdminUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Try to get user info from localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setAdminUser(parsedUser);
        } catch (e) {
          console.log('Error parsing stored user:', e);
        }
      }

      // Also fetch fresh user data from the server
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setAdminUser(userData);
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (apiError) {
        console.log('API call failed, using localStorage data:', apiError);
        // If API fails, we'll use the localStorage data we already set above
      }
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch consolidated admin statistics (activeCandidates, activeJobs,
      // totalPlacements and categoryStats) in a single request.  This
      // endpoint is implemented in the backend and returns JSON.
      const statsRes = await fetch('/api/admin/stats');
      
      console.log('Stats response status:', statsRes.status);
      console.log('Stats response headers:', statsRes.headers.get('content-type'));
      
      if (!statsRes.ok) {
        // Log the actual response text to see what's being returned
        const responseText = await statsRes.text();
        console.log('Error response text:', responseText);
        throw new Error(`HTTP ${statsRes.status}: ${responseText}`);
      }
      const statsData = await statsRes.json();

      // Optionally fetch category stats separately if more detailed
      // metrics (e.g. avg_days_to_placement) are required.  If the
      // request fails we silently ignore and fall back to the
      // categoryStats returned from /api/admin/stats.
      let categoryData = statsData.categoryStats || [];
      try {
        const categoryResponse = await fetch('/api/reports/category-stats');
        if (categoryResponse.ok) {
          const catJson = await categoryResponse.json();
          categoryData = catJson;
        }
      } catch (e) {
        // ignore
      }

      setStats(prev => ({
        ...prev,
        activeCandidates: statsData.activeCandidates || 0,
        activeJobs: statsData.activeJobs || 0,
        totalPlacements: statsData.totalPlacements || 0,
        categoryStats: categoryData
      }));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();
  }, [activeSection]);

  // Update stats when WebSocket data changes
  useEffect(() => {
    if (wsData) {
      setStats(prev => ({
        ...prev,
        ...wsData
      }));
    }
  }, [wsData]);

  // Show WebSocket connection status
  useEffect(() => {
    if (wsError) {
      setError('Lost connection to server. Some data may not be up to date.');
    } else if (isConnected) {
      setError(null);
    }
  }, [wsError, isConnected]);

  const [users] = useState([
    {
      id: 1,
      name: 'ישראל ישראלי',
      email: 'israel@example.com',
      phone: '050-1234567'
    },
    {
      id: 2,
      name: 'שרה כהן',
      email: 'sarah@example.com',
      phone: '052-7654321'
    }
  ]);

  const [resumes, setResumes] = useState([
    {
      id: 1,
      name: 'ישראל ישראלי',
      location: 'תל אביב',
      status: 'new',
      statusText: 'חדש',
      jobTitle: 'מפתח Full Stack',
      skills: ['React', 'Node.js', 'MongoDB'],
      pdfUrl: '/resumes/resume1.pdf'
    },
    {
      id: 2,
      name: 'שרה כהן',
      location: 'ירושלים',
      status: 'reviewed',
      statusText: 'נבדק',
      jobTitle: 'מעצבת UX/UI',
      skills: ['Figma', 'Adobe XD', 'UI Design'],
      pdfUrl: '/resumes/resume2.pdf'
    }
  ]);

  const [candidateStats, setCandidateStats] = useState({
    recentApplications: [],
    activeCandidates: []
  });

  useEffect(() => {
    // On component mount, load dashboard statistics and admin user info
    fetchAdminUser();
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'candidates':
        return <CandidateManagement />;
      case 'employers':
        return <EmployerManagement />;
      case 'jobs':
        return <JobManager />;
      case 'users':
        return <UserManagement />;
      case 'applications':
        return <ApplicationsView userRole="admin" />;
      case 'placements':
        return (
          <div className="placements-section">
            <h2>השמות</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <WorkHistoryIcon className="stat-icon" />
                  <h3>השמות החודש</h3>
                </div>
                <p className="stat-value">12</p>
                <div className="stat-footer">גידול של 20% מהחודש הקודם</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <TrendingUpIcon className="stat-icon" />
                  <h3>אחוז השמה</h3>
                </div>
                <p className="stat-value">68%</p>
                <div className="stat-footer">מתוך כלל המועמדים בתהליך</div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <TimelineIcon className="stat-icon" />
                  <h3>זמן ממוצע להשמה</h3>
                </div>
                <p className="stat-value">21</p>
                <div className="stat-footer">ימים מתחילת התהליך</div>
              </div>
            </div>
            
            <div className="placements-details">
              <div className="recent-placements">
                <h3>השמות אחרונות</h3>
                <div className="placement-list">
                  <div className="placement-item">
                    <div className="placement-content">
                      <span className="placement-title">מיכל לוי</span>
                      <span className="placement-details">DevOps Engineer</span>
                      <span className="placement-date">23/08/2025</span>
                    </div>
                  </div>
                  <div className="placement-item">
                    <div className="placement-content">
                      <span className="placement-title">יוסי כהן</span>
                      <span className="placement-details">QA Automation</span>
                      <span className="placement-date">21/08/2025</span>
                    </div>
                  </div>
                  <div className="placement-item">
                    <div className="placement-content">
                      <span className="placement-title">שירה לוי</span>
                      <span className="placement-details">מנהל/ת מכירות</span>
                      <span className="placement-date">19/08/2025</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="department-stats">
                <h3>השמות לפי מחלקה</h3>
                <div className="department-list">
                  <div className="department-item">
                    <span className="department-name">הייטק</span>
                    <div className="department-bar">
                      <div className="bar-fill" style={{ width: '75%' }}></div>
                    </div>
                    <span className="department-value">75%</span>
                  </div>
                  <div className="department-item">
                    <span className="department-name">לוגיסטיקה ותפעול</span>
                    <div className="department-bar">
                      <div className="bar-fill" style={{ width: '60%' }}></div>
                    </div>
                    <span className="department-value">60%</span>
                  </div>
                  <div className="department-item">
                    <span className="department-name">מכירות ושיווק</span>
                    <div className="department-bar">
                      <div className="bar-fill" style={{ width: '45%' }}></div>
                    </div>
                    <span className="department-value">45%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="reports-section">
            <h2>דוחות וניתוחים</h2>
            {loading ? (
              <div className="loading">טוען נתונים...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : (
              <div className="reports-grid">
                <div className="report-card">
                  <h3>סטטיסטיקות לפי קטגוריה</h3>
                  <div className="category-stats">
                    {stats.categoryStats.map((category) => (
                      <div key={category.name} className="category-group">
                        <h4>{category.name}</h4>
                        <div className="stats-row">
                          <div className="stat-item">
                            <span className="stat-label">השמות החודש</span>
                            <span className="stat-value">{category.monthlyPlacements}</span>
                            <span className={`trend ${category.trend >= 0 ? 'positive' : 'negative'}`}>
                              {category.trend >= 0 ? '+' : ''}{category.trend}%
                            </span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">זמן ממוצע להשמה</span>
                            <span className="stat-value">{category.avgDaysToPlacement} ימים</span>
                            <span className={`trend ${category.daysToPlacementTrend <= 0 ? 'positive' : 'negative'}`}>
                              {category.daysToPlacementTrend <= 0 ? '' : '+'}{category.daysToPlacementTrend} ימים
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="report-card">
                  <h3>סיכום כללי</h3>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-label">מועמדים פעילים</span>
                      <span className="stat-value">{stats.activeCandidates}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">משרות פתוחות</span>
                      <span className="stat-value">{stats.activeJobs}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">סה"כ השמות</span>
                      <span className="stat-value">{stats.totalPlacements}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'jobs':
        return <JobManager />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-profile">
          <div className="admin-info">
            <div className="header-logo">
              <img src={process.env.PUBLIC_URL + '/logo/admin-logo.svg'} alt="JobPortal Admin" />
            </div>
            <div className="admin-text">
              <h1>שלום, {adminUser?.full_name || adminUser?.name || 'מנהל'}</h1>
              <p className="admin-subtitle">ברוך הבא למערכת הניהול</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="admin-avatar">
              <img src={process.env.PUBLIC_URL + '/logo/admin-icon.svg'} alt="Admin" className="avatar-icon" />
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogoutIcon className="btn-icon" />
              התנתק
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="sidebar">
          <button
            className={`nav-btn ${activeSection === 'candidates' ? 'active' : ''}`}
            onClick={() => setActiveSection('candidates')}
          >
            <PersonIcon className="nav-icon" />
            מועמדים
          </button>
          <button
            className={`nav-btn ${activeSection === 'employers' ? 'active' : ''}`}
            onClick={() => setActiveSection('employers')}
          >
            <BusinessIcon className="nav-icon" />
            מעסיקים
          </button>

          {/* Jobs management section for admin */}
          <button
            className={`nav-btn ${activeSection === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveSection('jobs')}
          >
            <WorkIcon className="nav-icon" />
            משרות
          </button>
          <button
            className={`nav-btn ${activeSection === 'placements' ? 'active' : ''}`}
            onClick={() => setActiveSection('placements')}
          >
            <WorkHistoryIcon className="nav-icon" />
            השמות
          </button>
          <button
            className={`nav-btn ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            <AssessmentIcon className="nav-icon" />
            דוחות
          </button>
          <button
            className={`nav-btn ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSection('users')}
          >
            <PersonAddIcon className="nav-icon" />
            ניהול משתמשים
          </button>
          <button
            className={`nav-btn ${activeSection === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveSection('applications')}
          >
            <AssignmentIcon className="nav-icon" />
            מועמדויות
          </button>
        </nav>

        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
