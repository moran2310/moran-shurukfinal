import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import './JobList.css';

const JobList = ({ category }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // WebSocket connection for real-time updates
  const { data: wsData, error: wsError, isConnected } = useWebSocket('ws://localhost:5000');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs${category ? `?category=${category}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [category]);

  // Update jobs when WebSocket data changes
  useEffect(() => {
    if (wsData?.type === 'jobs') {
      setJobs(prev => {
        const updatedJobs = [...prev];
        const jobIndex = updatedJobs.findIndex(job => job.id === wsData.data.id);
        
        if (jobIndex === -1 && wsData.action === 'add') {
          // New job added
          updatedJobs.unshift(wsData.data);
        } else if (jobIndex !== -1) {
          if (wsData.action === 'update') {
            // Job updated
            updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], ...wsData.data };
          } else if (wsData.action === 'delete') {
            // Job deleted
            updatedJobs.splice(jobIndex, 1);
          }
        }
        
        return updatedJobs;
      });
    }
  }, [wsData]);

  if (loading) return <div className="loading">טוען משרות...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="job-list">
      {jobs.map(job => (
        <div key={job.id} className="job-card">
          <div className="job-header">
            <h3>{job.title}</h3>
            <span className={`status ${job.status}`}>{job.statusText}</span>
          </div>
          <div className="job-details">
            <div className="company-info">
              <span className="company-name">{job.company}</span>
              <span className="location">{job.location}</span>
            </div>
            <div className="job-meta">
              <span className="salary">{job.salary}</span>
              <span className="job-type">{job.type}</span>
            </div>
          </div>
          <div className="job-description">{job.description}</div>
          <div className="job-footer">
            <div className="requirements">
              <h4>דרישות התפקיד</h4>
              <ul>
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
            <button className="apply-btn">הגש מועמדות</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobList;
