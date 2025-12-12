import React, { useState, useEffect } from 'react';
import './JobManager.css';

/**
 * Admin JobManager component
 *
 * This component provides a simple interface for administrators to manage
 * job postings directly from the dashboard.  It allows viewing the list
 * of existing jobs, creating new jobs, updating existing jobs and deleting
 * jobs.  All API calls include the JWT token stored in localStorage so
 * that the server can both authenticate the request and verify the caller
 * has the admin role (enforced by the backend via the requireAdmin
 * middleware).  Form fields map directly to the columns in the `jobs`
 * table as defined in the backend's createJobsTable function.
 */
const JobManager = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    salary_min: '',
    salary_max: '',
    location: '',
    job_type: '',
    category: '',
    company_name: '',
    status: 'active'
  });
  const [editingId, setEditingId] = useState(null);

  // State for tracking applications of the currently selected job.
  // When an admin clicks "View Applications" on a job, this state
  // will hold the list of applications fetched from the backend. We
  // also store the job title and id to display contextual headers.
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [selectedJobApplications, setSelectedJobApplications] = useState([]);

  // Helper to fetch applications for a given job.  This calls the
  // `/api/admin/jobs/:jobId/applications` endpoint which returns
  // candidate information and their uploaded CV file path.  If the
  // fetch fails, an error is stored in the `error` state.
  const fetchApplicationsForJob = async (job) => {
    if (!job || !job.id) return;
    try {
      // Do not set global loading state while loading applications,
      // otherwise the jobs list may temporarily disappear. Instead we
      // simply clear any previous error and continue.
      setError(null);
      // Save selected job info
      setSelectedJobId(job.id);
      setSelectedJobTitle(job.title || '');
      const res = await fetch(`/api/admin/jobs/${job.id}/applications`);
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resBody.message || resBody.error || 'Failed to fetch applications');
      }
      setSelectedJobApplications(resBody);
    } catch (err) {
      setError(err.message);
      setSelectedJobApplications([]);
    } finally {
      // No-op: we didn't set loading flag here on purpose to avoid
      // interfering with the jobs list rendering.
    }
  };

  // Fetch the list of jobs from the server
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/jobs');
      if (!res.ok) {
        // Try to parse error message from server
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to fetch jobs');
      }
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = jobs.filter(job =>
        (job.title && job.title.toLowerCase().includes(lowercasedFilter)) ||
        (job.company_name && job.company_name.toLowerCase().includes(lowercasedFilter)) ||
        (job.location && job.location.toLowerCase().includes(lowercasedFilter))
      );
      setFilteredJobs(filtered);
    }
  }, [searchTerm, jobs]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle changes to any form field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit the form to create or update a job
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/jobs/${editingId}` : '/api/admin/jobs';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resBody.message || resBody.error || 'Failed to save job');
      }
      // Refresh list and reset form
      await fetchJobs();
      setForm({
        title: '',
        description: '',
        requirements: '',
        salary_min: '',
        salary_max: '',
        location: '',
        job_type: '',
        category: '',
        company_name: '',
        status: 'active'
      });
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Populate the form for editing an existing job
  const handleEdit = (job) => {
    setEditingId(job.id);
    setForm({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      salary_min: job.salary_min !== null && job.salary_min !== undefined ? job.salary_min : '',
      salary_max: job.salary_max !== null && job.salary_max !== undefined ? job.salary_max : '',
      location: job.location || '',
      job_type: job.job_type || '',
      category: job.category || '',
      company_name: job.company_name || '',
      status: job.status || 'active'
    });
  };

  // Delete a job from the database
  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשרה?')) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE'
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resBody.message || resBody.error || 'Failed to delete job');
      }
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="job-manager">
      <div className="manager-header">
        <h2>חפש משרות</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="חפש משרות..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button className="search-button" onClick={(e) => e.preventDefault()}>
            <i className="fas fa-search"></i> חיפוש
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form className="job-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">כותרת המשרה</label>
            <input
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="למשל: מפתח Full Stack"
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">מיקום</label>
            <input
              id="location"
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="תל אביב, חיפה, עבודה מהבית"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="description">תיאור המשרה</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              required
              placeholder="תאר את המשרה, התפקידים והאחריות"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="requirements">דרישות המשרה</label>
            <textarea
              id="requirements"
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              rows="2"
              placeholder="ניסיון, השכלה, כישורים נדרשים"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="salary_min">שכר מינימום (₪)</label>
            <input
              id="salary_min"
              type="number"
              name="salary_min"
              value={form.salary_min}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="salary_max">שכר מקסימום (₪)</label>
            <input
              id="salary_max"
              type="number"
              name="salary_max"
              value={form.salary_max}
              onChange={handleChange}
              min="0"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="job_type">סוג המשרה</label>
            <input
              id="job_type"
              type="text"
              name="job_type"
              value={form.job_type}
              onChange={handleChange}
              placeholder="משרה מלאה, משרה חלקית וכו'"
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">קטגוריה</label>
            <input
              id="category"
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="הייטק, שיווק ומכירות וכו'"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="company_name">שם החברה</label>
            <input
              id="company_name"
              type="text"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">סטטוס</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="active">פעילה</option>
              <option value="closed">סגורה</option>
              <option value="draft">טיוטה</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="save-btn">
            {editingId ? 'עדכן משרה' : 'הוסף משרה'}
          </button>
          {editingId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setEditingId(null);
                setForm({
                  title: '',
                  description: '',
                  requirements: '',
                  salary_min: '',
                  salary_max: '',
                  location: '',
                  job_type: '',
                  category: '',
                  company_name: '',
                  status: 'active'
                });
              }}
            >
              ביטול
            </button>
          )}
        </div>
      </form>
      <hr />
      <div className="jobs-list">
        {loading ? (
          <div className="loading">טוען משרות...</div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="job-item">
              <div className="job-summary">
                <h4>{job.title}</h4>
                <p className="job-meta">
                  {job.location && <span>{job.location}</span>}
                  {job.salary_min && job.salary_max && (
                    <span>
                      {' '}
                      | ₪{Number(job.salary_min).toLocaleString()} - ₪{Number(job.salary_max).toLocaleString()}
                    </span>
                  )}
                  {job.status && <span> | {job.status === 'active' ? 'פעילה' : job.status === 'closed' ? 'סגורה' : 'טיוטה'}</span>}
                </p>
              </div>
              <div className="job-actions">
                <button onClick={() => handleEdit(job)} className="edit-btn">ערוך</button>
                <button onClick={() => handleDelete(job.id)} className="delete-btn">מחק</button>
                <button onClick={() => fetchApplicationsForJob(job)} className="view-apps-btn">הצג מועמדויות</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Applications List Section */}
      {selectedJobId && (
        <div className="applications-section">
          <h3>מועמדויות למשרה: {selectedJobTitle}</h3>
          {selectedJobApplications.length === 0 ? (
            <p>אין מועמדויות להצגה.</p>
          ) : (
            <table className="applications-table">
              <thead>
                <tr>
                  <th>שם מלא</th>
                  <th>אימייל</th>
                  <th>טלפון</th>
                  <th>כישורים</th>
                  <th>ניסיון (שנים)</th>
                  <th>השכלה</th>
                  <th>קורות חיים</th>
                </tr>
              </thead>
              <tbody>
                {selectedJobApplications.map((app) => {
                  // Extract file name from cv_file path (e.g. 'uploads/cvs/cv-12345.pdf')
                  const cvFileName = app.cv_file ? app.cv_file.split('/').pop() : null;
                  const cvDownloadUrl = cvFileName ? `/api/download-cv/${cvFileName}` : null;
                  return (
                    <tr key={app.id}>
                      <td>{app.full_name || '-'}</td>
                      <td>{app.email || '-'}</td>
                      <td>{app.phone || '-'}</td>
                      <td>{app.skills || '-'}</td>
                      <td>{app.experience_years || '-'}</td>
                      <td>{app.education || '-'}</td>
                      <td>
                        {cvDownloadUrl ? (
                          <a href={cvDownloadUrl} target="_blank" rel="noopener noreferrer">
                            הורד קורות חיים
                          </a>
                        ) : (
                          'אין קובץ'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default JobManager;