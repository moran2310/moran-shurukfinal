import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import './EmployerDashboard.css';

const EmployerDashboard = () => {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    pendingReviews: 0,
    interviews: 0,
    placements: 0
  });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // WebSocket connection for real-time updates
  const { data: wsData, error: wsError, isConnected } = useWebSocket('ws://localhost:5000');

  const fetchEmployerData = async () => {
    try {
      setLoading(true);
      const [statsRes, jobsRes, applicationsRes] = await Promise.all([
        fetch('/api/employer/stats'),
        fetch('/api/employer/jobs'),
        fetch('/api/employer/applications')
      ]);

      if (!statsRes.ok || !jobsRes.ok || !applicationsRes.ok) {
        throw new Error('Failed to fetch employer data');
      }

      const [statsData, jobsData, applicationsData] = await Promise.all([
        statsRes.json(),
        jobsRes.json(),
        applicationsRes.json()
      ]);

      setStats(statsData);
      setJobs(jobsData);
      setApplications(applicationsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEmployerData();
  }, []);

  // Update data when WebSocket data changes
  useEffect(() => {
    if (wsData) {
      switch (wsData.type) {
        case 'employer_stats':
          setStats(prev => ({ ...prev, ...wsData.data }));
          break;
        case 'employer_jobs':
          setJobs(prev => {
            const updatedJobs = [...prev];
            const jobIndex = updatedJobs.findIndex(job => job.id === wsData.data.id);
            
            if (jobIndex === -1 && wsData.action === 'add') {
              updatedJobs.unshift(wsData.data);
            } else if (jobIndex !== -1) {
              if (wsData.action === 'update') {
                updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], ...wsData.data };
              } else if (wsData.action === 'delete') {
                updatedJobs.splice(jobIndex, 1);
              }
            }
            
            return updatedJobs;
          });
          break;
        case 'employer_applications':
          setApplications(prev => {
            const updatedApplications = [...prev];
            const appIndex = updatedApplications.findIndex(app => app.id === wsData.data.id);
            
            if (appIndex === -1 && wsData.action === 'add') {
              updatedApplications.unshift(wsData.data);
            } else if (appIndex !== -1) {
              if (wsData.action === 'update') {
                updatedApplications[appIndex] = { ...updatedApplications[appIndex], ...wsData.data };
              } else if (wsData.action === 'delete') {
                updatedApplications.splice(appIndex, 1);
              }
            }
            
            return updatedApplications;
          });
          break;
      }
    }
  }, [wsData]);

  if (loading) return <div className="loading">טוען נתונים...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="employer-dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <WorkIcon className="stat-icon" />
          <div className="stat-content">
            <h3>משרות פעילות</h3>
            <p className="stat-value">{stats.activeJobs}</p>
          </div>
        </div>
        <div className="stat-card">
          <PersonIcon className="stat-icon" />
          <div className="stat-content">
            <h3>מועמדויות</h3>
            <p className="stat-value">{stats.totalApplications}</p>
          </div>
        </div>
        <div className="stat-card">
          <BusinessIcon className="stat-icon" />
          <div className="stat-content">
            <h3>השמות</h3>
            <p className="stat-value">{stats.placements}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="active-jobs">
          <h2>משרות פעילות</h2>
          <div className="jobs-list">
            {jobs.map(job => (
              <div key={job.id} className="job-item">
                <h3>{job.title}</h3>
                <div className="job-meta">
                  <span className="applications-count">
                    {job.applicationsCount} מועמדים
                  </span>
                  <span className={`status ${job.status}`}>
                    {job.statusText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-applications">
          <h2>מועמדויות אחרונות</h2>
          <div className="applications-list">
            {applications.map(app => (
              <div key={app.id} className="application-item">
                <div className="candidate-info">
                  <h3>{app.candidateName}</h3>
                  <p>{app.jobTitle}</p>
                </div>
                <div className="application-meta">
                  <span className={`status ${app.status}`}>
                    {app.statusText}
                  </span>
                  <span className="date">{app.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
