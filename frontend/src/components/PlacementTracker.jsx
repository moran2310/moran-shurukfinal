import React, { useState, useEffect } from 'react';
import './PlacementTracker.css';

const PlacementTracker = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [newPlacement, setNewPlacement] = useState({
    job_id: '',
    candidate_id: '',
    start_date: '',
    salary: '',
    placement_fee: '',
    notes: ''
  });

  useEffect(() => {
    fetchPlacements();
    fetchJobs();
    fetchCandidates();
  }, []);

  const fetchPlacements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/placements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setPlacements(data);
    } catch (error) {
      console.error('Error fetching placements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const handleCreatePlacement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/placements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPlacement)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewPlacement({
          job_id: '',
          candidate_id: '',
          start_date: '',
          salary: '',
          placement_fee: '',
          notes: ''
        });
        fetchPlacements();
        alert('השמה נוצרה בהצלחה!');
      } else {
        const error = await response.json();
        alert(error.error || 'שגיאה ביצירת השמה');
      }
    } catch (error) {
      console.error('Error creating placement:', error);
      alert('שגיאה ביצירת השמה');
    }
  };

  const updatePlacementStatus = async (placementId, status, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/placements/${placementId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        fetchPlacements();
        alert('סטטוס השמה עודכן בהצלחה!');
      } else {
        const error = await response.json();
        alert(error.error || 'שגיאה בעדכון סטטוס');
      }
    } catch (error) {
      console.error('Error updating placement status:', error);
      alert('שגיאה בעדכון סטטוס');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'completed': return '#007bff';
      case 'terminated': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'completed': return 'הושלם';
      case 'terminated': return 'הופסק';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="placement-tracker loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>טוען השמות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="placement-tracker">
      <div className="tracker-header">
        <h2>מעקב השמות</h2>
        <button 
          className="create-placement-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + צור השמה חדשה
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-overlay">
          <div className="create-form">
            <h3>צור השמה חדשה</h3>
            <form onSubmit={handleCreatePlacement}>
              <div className="form-row">
                <div className="form-group">
                  <label>משרה</label>
                  <select
                    value={newPlacement.job_id}
                    onChange={(e) => setNewPlacement({...newPlacement, job_id: e.target.value})}
                    required
                  >
                    <option value="">בחר משרה</option>
                    {jobs.map(job => (
                      <option key={job.id || job.JobID} value={job.id || job.JobID}>
                        {job.title || job.Title} - {job.company_name || job.CompanyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>מועמד</label>
                  <select
                    value={newPlacement.candidate_id}
                    onChange={(e) => setNewPlacement({...newPlacement, candidate_id: e.target.value})}
                    required
                  >
                    <option value="">בחר מועמד</option>
                    {candidates.map(candidate => (
                      <option key={candidate.CandidateID} value={candidate.CandidateID}>
                        {candidate.FullName} - {candidate.Email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>תאריך התחלה</label>
                  <input
                    type="date"
                    value={newPlacement.start_date}
                    onChange={(e) => setNewPlacement({...newPlacement, start_date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>שכר</label>
                  <input
                    type="number"
                    placeholder="שכר חודשי"
                    value={newPlacement.salary}
                    onChange={(e) => setNewPlacement({...newPlacement, salary: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>עמלת השמה</label>
                  <input
                    type="number"
                    placeholder="עמלה"
                    value={newPlacement.placement_fee}
                    onChange={(e) => setNewPlacement({...newPlacement, placement_fee: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>הערות</label>
                <textarea
                  placeholder="הערות נוספות..."
                  value={newPlacement.notes}
                  onChange={(e) => setNewPlacement({...newPlacement, notes: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">צור השמה</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="placements-grid">
        {placements.length === 0 ? (
          <div className="no-placements">
            <div className="no-placements-icon">📋</div>
            <h3>אין השמות</h3>
            <p>לא נמצאו השמות במערכת</p>
          </div>
        ) : (
          placements.map((placement) => (
            <div key={placement.id} className="placement-card">
              <div className="placement-header">
                <div className="placement-info">
                  <h4>{placement.job_title}</h4>
                  <p className="candidate-name">{placement.candidate_name}</p>
                  <p className="company-name">{placement.company_name}</p>
                </div>
                <div 
                  className="placement-status"
                  style={{ backgroundColor: getStatusColor(placement.status) }}
                >
                  {getStatusText(placement.status)}
                </div>
              </div>

              <div className="placement-details">
                <div className="detail-item">
                  <span className="label">תאריך התחלה:</span>
                  <span className="value">{formatDate(placement.start_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">שכר:</span>
                  <span className="value">{formatCurrency(placement.salary)}</span>
                </div>
                {placement.placement_fee && (
                  <div className="detail-item">
                    <span className="label">עמלה:</span>
                    <span className="value">{formatCurrency(placement.placement_fee)}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">נוצר:</span>
                  <span className="value">{formatDate(placement.created_at)}</span>
                </div>
              </div>

              {placement.notes && (
                <div className="placement-notes">
                  <strong>הערות:</strong>
                  <p>{placement.notes}</p>
                </div>
              )}

              <div className="placement-actions">
                {placement.status === 'active' && (
                  <>
                    <button 
                      className="action-btn complete"
                      onClick={() => updatePlacementStatus(placement.id, 'completed')}
                    >
                      סמן כהושלם
                    </button>
                    <button 
                      className="action-btn terminate"
                      onClick={() => updatePlacementStatus(placement.id, 'terminated')}
                    >
                      הפסק השמה
                    </button>
                  </>
                )}
                {placement.status === 'terminated' && (
                  <button 
                    className="action-btn reactivate"
                    onClick={() => updatePlacementStatus(placement.id, 'active')}
                  >
                    הפעל מחדש
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlacementTracker;
