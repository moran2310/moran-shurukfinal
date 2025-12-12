import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchStatistics();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchUserLogs = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserLogs(data);
      }
    } catch (error) {
      console.error('Error fetching user logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRoleId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ roleId: newRoleId })
      });

      if (response.ok) {
        alert('תפקיד המשתמש עודכן בהצלחה!');
        fetchUsers(); // Refresh the users list
        fetchStatistics(); // Refresh statistics
      } else {
        alert('שגיאה בעדכון תפקיד המשתמש');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('שגיאה בעדכון תפקיד המשתמש');
    }
  };

  const handleViewLogs = (user) => {
    setSelectedUser(user);
    fetchUserLogs(user.id);
    setShowLogsModal(true);
  };

  const getRoleBadgeColor = (roleName) => {
    switch(roleName) {
      case 'admin': return '#e74c3c';
      case 'employer': return '#3498db';
      case 'worker': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getActivityIcon = (activityType) => {
    switch(activityType) {
      case 'registration': return '👤';
      case 'job_application': return '📝';
      case 'job_posted': return '💼';
      default: return '📋';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role_name === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="user-management-container">
      <div className="admin-header">
        <h1>ניהול משתמשים</h1>
        <p>ניהול כל המשתמשים במערכת ותפקידיהם</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{statistics.total_users || 0}</div>
            <div className="stat-label">סך המשתמשים</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👷</div>
          <div className="stat-content">
            <div className="stat-number">{statistics.total_workers || 0}</div>
            <div className="stat-label">עובדים</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-number">{statistics.total_employers || 0}</div>
            <div className="stat-label">מעסיקים</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-number">{statistics.new_users_today || 0}</div>
            <div className="stat-label">משתמשים חדשים היום</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="חיפוש לפי שם או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="role-filter"
        >
          <option value="all">כל התפקידים</option>
          <option value="admin">מנהלים</option>
          <option value="employer">מעסיקים</option>
          <option value="worker">עובדים</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>משתמש</th>
              <th>אימייל</th>
              <th>תפקיד</th>
              <th>תאריך הרשמה</th>
              <th>פעילות</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.full_name}</div>
                      <div className="user-id">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role_id}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    className="role-select"
                    style={{ backgroundColor: getRoleBadgeColor(user.role_name) }}
                  >
                    {roles.map(role => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('he-IL')}</td>
                <td>
                  <div className="activity-stats">
                    {user.role_name === 'worker' && (
                      <span className="activity-badge">
                        📝 {user.applications_count} מועמדויות
                      </span>
                    )}
                    {user.role_name === 'employer' && (
                      <span className="activity-badge">
                        💼 {user.jobs_posted} משרות
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <button 
                    className="action-btn view-logs-btn"
                    onClick={() => handleViewLogs(user)}
                  >
                    📊 צפה בלוגים
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Logs Modal */}
      {showLogsModal && (
        <div className="modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="modal-content logs-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>פעילות המשתמש: {selectedUser?.full_name}</h2>
              <button className="close-btn" onClick={() => setShowLogsModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="loading">טוען פעילות...</div>
              ) : userLogs.length > 0 ? (
                <div className="logs-list">
                  {userLogs.map((log, index) => (
                    <div key={index} className="log-item">
                      <div className="log-icon">
                        {getActivityIcon(log.activity_type)}
                      </div>
                      <div className="log-content">
                        <div className="log-description">{log.description}</div>
                        <div className="log-date">
                          {new Date(log.activity_date).toLocaleString('he-IL')}
                        </div>
                      </div>
                      <div className="log-type">
                        {log.activity_type === 'registration' && 'הרשמה'}
                        {log.activity_type === 'job_application' && 'מועמדות'}
                        {log.activity_type === 'job_posted' && 'פרסום משרה'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-logs">אין פעילות רשומה עבור משתמש זה</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
