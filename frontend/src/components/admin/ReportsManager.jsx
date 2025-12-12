import React, { useState, useEffect } from 'react';
import './ReportsManager.css';

const ReportsManager = () => {
  const [reports, setReports] = useState({
    jobStats: null,
    userStats: null,
    placementStats: null
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`http://localhost:3010/api/admin/reports?range=${dateRange}`);
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">טוען...</div>;
  }

  return (
    <div className="reports-manager">
      <div className="reports-header">
        <h2>דוחות מערכת</h2>
        <div className="date-range-selector">
          <button 
            className={`range-btn ${dateRange === 'week' ? 'active' : ''}`}
            onClick={() => setDateRange('week')}
          >
            שבוע אחרון
          </button>
          <button 
            className={`range-btn ${dateRange === 'month' ? 'active' : ''}`}
            onClick={() => setDateRange('month')}
          >
            חודש אחרון
          </button>
          <button 
            className={`range-btn ${dateRange === 'year' ? 'active' : ''}`}
            onClick={() => setDateRange('year')}
          >
            שנה אחרונה
          </button>
        </div>
      </div>

      <div className="reports-grid">
        {/* Jobs Statistics */}
        <div className="report-card">
          <h3>סטטיסטיקת משרות</h3>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">משרות פעילות</span>
              <span className="stat-value">{reports.jobStats?.activeJobs || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">משרות חדשות</span>
              <span className="stat-value highlight">{reports.jobStats?.newJobs || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">משרות שנסגרו</span>
              <span className="stat-value">{reports.jobStats?.closedJobs || 0}</span>
            </div>
          </div>
          <div className="chart-container">
            {/* Chart will be added here */}
          </div>
        </div>

        {/* User Statistics */}
        <div className="report-card">
          <h3>סטטיסטיקת משתמשים</h3>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">משתמשים חדשים</span>
              <span className="stat-value highlight">{reports.userStats?.newUsers || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">מעסיקים חדשים</span>
              <span className="stat-value">{reports.userStats?.newEmployers || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">משתמשים פעילים</span>
              <span className="stat-value">{reports.userStats?.activeUsers || 0}</span>
            </div>
          </div>
          <div className="chart-container">
            {/* Chart will be added here */}
          </div>
        </div>

        {/* Placement Statistics */}
        <div className="report-card">
          <h3>סטטיסטיקת השמות</h3>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">סה"כ מועמדויות</span>
              <span className="stat-value">{reports.placementStats?.totalApplications || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">התקבלו לעבודה</span>
              <span className="stat-value success">{reports.placementStats?.successful || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">בתהליך</span>
              <span className="stat-value warning">{reports.placementStats?.inProcess || 0}</span>
            </div>
          </div>
          <div className="chart-container">
            {/* Chart will be added here */}
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="report-card full-width">
          <h3>התפלגות לפי קטגוריות</h3>
          <div className="categories-distribution">
            <table>
              <thead>
                <tr>
                  <th>קטגוריה</th>
                  <th>משרות פעילות</th>
                  <th>מועמדים</th>
                  <th>אחוז השמה</th>
                </tr>
              </thead>
              <tbody>
                {reports.jobStats?.categoriesDistribution?.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.activeJobs}</td>
                    <td>{category.candidates}</td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress" 
                          style={{ width: `${category.placementRate}%` }}
                        />
                        <span>{category.placementRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
