import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import PersonIcon from '@mui/icons-material/Person';
import './CandidateList.css';

const CandidateList = ({ filter }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // WebSocket connection for real-time updates
  const { data: wsData, error: wsError, isConnected } = useWebSocket('ws://localhost:5000');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/candidates${filter ? `?status=${filter}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch candidates');
      const data = await response.json();
      setCandidates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCandidates();
  }, [filter]);

  // Update candidates when WebSocket data changes
  useEffect(() => {
    if (wsData?.type === 'candidates') {
      setCandidates(prev => {
        const updatedCandidates = [...prev];
        const candidateIndex = updatedCandidates.findIndex(c => c.id === wsData.data.id);
        
        if (candidateIndex === -1 && wsData.action === 'add') {
          // New candidate added
          updatedCandidates.unshift(wsData.data);
        } else if (candidateIndex !== -1) {
          if (wsData.action === 'update') {
            // Candidate updated
            updatedCandidates[candidateIndex] = { 
              ...updatedCandidates[candidateIndex], 
              ...wsData.data 
            };
          } else if (wsData.action === 'delete') {
            // Candidate removed
            updatedCandidates.splice(candidateIndex, 1);
          }
        }
        
        return updatedCandidates;
      });
    }
  }, [wsData]);

  if (loading) return <div className="loading">טוען מועמדים...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="candidate-list">
      {candidates.map(candidate => (
        <div key={candidate.id} className="candidate-card">
          <div className="candidate-header">
            <div className="candidate-avatar">
              <PersonIcon />
            </div>
            <div className="candidate-info">
              <h3>{candidate.name}</h3>
              <span className={`status ${candidate.status}`}>
                {candidate.statusText}
              </span>
            </div>
          </div>
          <div className="candidate-details">
            <div className="detail-row">
              <span className="label">תפקיד מבוקש:</span>
              <span className="value">{candidate.desiredRole}</span>
            </div>
            <div className="detail-row">
              <span className="label">ניסיון:</span>
              <span className="value">{candidate.experience} שנים</span>
            </div>
            <div className="detail-row">
              <span className="label">מיקום:</span>
              <span className="value">{candidate.location}</span>
            </div>
          </div>
          <div className="candidate-skills">
            {candidate.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
          <div className="candidate-footer">
            <button className="view-profile-btn">צפה בפרופיל</button>
            <button className="contact-btn">צור קשר</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CandidateList;
