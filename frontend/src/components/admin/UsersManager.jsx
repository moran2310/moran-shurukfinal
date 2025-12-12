import React, { useState, useEffect } from 'react';
import './UsersManager.css';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3010/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...users];

    // Apply tab filter first
    switch (activeTab) {
      case 'workers':
        result = result.filter(user => user.role === 'worker');
        break;
      case 'employers':
        result = result.filter(user => user.role === 'employer');
        break;
      case 'active':
        result = result.filter(user => user.status === 'active');
        break;
      case 'new':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        result = result.filter(user => new Date(user.created_at) > oneWeekAgo);
        break;
      default:
        // 'all' - no filter
        break;
    }

    // Then apply search term filter
    if (searchTerm.trim() !== '') {
      const lowercasedFilter = searchTerm.toLowerCase();
      result = result.filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(lowercasedFilter)) ||
        (user.email && user.email.toLowerCase().includes(lowercasedFilter)) ||
        (user.phone && user.phone.includes(searchTerm))
      );
    }

    setFilteredUsers(result);
  }, [users, activeTab, searchTerm]);

  const handleViewCV = (userId) => {
    // Will implement CV viewer modal
    setSelectedUser(users.find(user => user.id === userId));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return <div className="loading">טוען...</div>;
  }

  return (
    <div className="users-manager">
      <div className="users-header">
        <h2>ניהול משתמשים</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="חפש מועמדים..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
          />
          <button
            className="search-button"
            onClick={(e) => {
              e.preventDefault();
              // Trigger search
              const event = { target: { value: searchTerm } };
              handleSearchChange(event);
            }}
          >
            <i className="fas fa-search"></i> חיפוש
          </button>
        </div>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            כל המשתמשים
          </button>
          <button
            className={`tab ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveTab('workers')}
          >
            מחפשי עבודה
          </button>
          <button
            className={`tab ${activeTab === 'employers' ? 'active' : ''}`}
            onClick={() => setActiveTab('employers')}
          >
            מעסיקים
          </button>
          <button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            פעילים כעת
          </button>
          <button
            className={`tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            חדשים
          </button>
        </div>
      </div>

      <div className="users-grid">
        {filteredUsers.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-header">
              <div className="user-avatar">
                {user.fullName?.charAt(0) || '?'}
              </div>
              <div className="user-info">
                <h3>{user.fullName}</h3>
                <p>{user.email}</p>
              </div>
              <div className={`user-status ${user.status}`}>
                {user.status === 'active' ? 'פעיל' : 'לא פעיל'}
              </div>
            </div>

            <div className="user-details">
              <p><strong>תפקיד:</strong> {user.role === 'worker' ? 'מחפש עבודה' : 'מעסיק'}</p>
              <p><strong>הצטרף:</strong> {new Date(user.created_at).toLocaleDateString('he-IL')}</p>
              {user.company && <p><strong>חברה:</strong> {user.company}</p>}
              {user.role === 'worker' && (
                <p><strong>מצב תעסוקה:</strong> {user.employed ? 'מועסק' : 'מחפש'}</p>
              )}
            </div>

            <div className="user-actions">
              {user.role === 'worker' && (
                <button
                  onClick={() => handleViewCV(user.id)}
                  className="view-cv-btn"
                >
                  צפה בקו"ח
                </button>
              )}
              <button className="contact-btn">צור קשר</button>
              <button className="block-btn">חסום</button>
            </div>
          </div>
        ))}
      </div>

      {selectedUser && (
        <div className="modal">
          {/* CV Viewer Modal - Will implement later */}
        </div>
      )}
    </div>
  );
};

export default UsersManager;
