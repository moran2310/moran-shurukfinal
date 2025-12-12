import React, { useState, useEffect } from 'react';
import './PlacementTracker.css';

const PlacementTracker = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const response = await fetch('http://localhost:3010/api/admin/placements');
      const data = await response.json();
      setPlacements(data);
    } catch (error) {
      console.error('Error fetching placements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPlacements = () => {
    switch (filter) {
      case 'hired':
        return placements.filter(p => p.status === 'hired');
      case 'pending':
        return placements.filter(p => p.status === 'pending');
      case 'rejected':
        return placements.filter(p => p.status === 'rejected');
      default:
        return placements;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'hired':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div className="loading">טוען...</div>;
  }

  return (
    <div className="placement-tracker">
      <div className="tracker-header">
        <h2>מעקב השמות</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            הכל
          </button>
          <button 
            className={`filter-btn ${filter === 'hired' ? 'active' : ''}`}
            onClick={() => setFilter('hired')}
          >
            התקבלו
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            בתהליך
          </button>
          <button 
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            נדחו
          </button>
        </div>
      </div>

      <div className="placements-table">
        <table>
          <thead>
            <tr>
              <th>מועמד</th>
              <th>משרה</th>
              <th>חברה</th>
              <th>תאריך הגשה</th>
              <th>סטטוס</th>
              <th>עדכון אחרון</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredPlacements().map((placement) => (
              <tr key={placement.id}>
                <td>
                  <div className="candidate-info">
                    <span className="candidate-name">{placement.candidateName}</span>
                    <span className="candidate-email">{placement.candidateEmail}</span>
                  </div>
                </td>
                <td>{placement.jobTitle}</td>
                <td>{placement.companyName}</td>
                <td>{new Date(placement.appliedDate).toLocaleDateString('he-IL')}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(placement.status)}`}>
                    {placement.status === 'hired' && 'התקבל'}
                    {placement.status === 'pending' && 'בתהליך'}
                    {placement.status === 'rejected' && 'נדחה'}
                  </span>
                </td>
                <td>{new Date(placement.lastUpdate).toLocaleDateString('he-IL')}</td>
                <td>
                  <div className="action-buttons">
                    <button className="view-btn">צפה בפרטים</button>
                    <button className="update-btn">עדכן סטטוס</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlacementTracker;
