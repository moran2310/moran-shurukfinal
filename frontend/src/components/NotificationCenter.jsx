import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import './NotificationCenter.css';

const NotificationCenter = ({ userId, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const { 
    notifications, 
    unreadCount, 
    markNotificationRead, 
    clearNotifications,
    isConnected 
  } = useWebSocket('ws://localhost:5000', {
    userId,
    userRole
  });

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_job':
        return '💼';
      case 'new_application':
        return '📝';
      case 'application_update':
        return '🔄';
      case 'application_status_update':
        return '📋';
      case 'placement_update':
        return '🎯';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_job':
        return '#007bff';
      case 'new_application':
        return '#28a745';
      case 'application_update':
        return '#ffc107';
      case 'application_status_update':
        return '#17a2b8';
      case 'placement_update':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'עכשיו';
    if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `לפני ${diffInHours} שעות`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `לפני ${diffInDays} ימים`;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
  };

  const handleMarkAllRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markNotificationRead(notification.id);
      }
    });
  };

  return (
    <div className="notification-center">
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="התראות"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        {!isConnected && <span className="connection-indicator offline"></span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>התראות</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read"
                  onClick={handleMarkAllRead}
                  title="סמן הכל כנקרא"
                >
                  <i className="fas fa-check-double"></i>
                </button>
              )}
              <button 
                className="clear-all"
                onClick={clearNotifications}
                title="נקה הכל"
              >
                <i className="fas fa-trash"></i>
              </button>
              <button 
                className="close-dropdown"
                onClick={() => setIsOpen(false)}
                title="סגור"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="notification-filters">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              הכל ({notifications.length})
            </button>
            <button 
              className={filter === 'unread' ? 'active' : ''}
              onClick={() => setFilter('unread')}
            >
              לא נקראו ({unreadCount})
            </button>
            <button 
              className={filter === 'new_job' ? 'active' : ''}
              onClick={() => setFilter('new_job')}
            >
              משרות חדשות
            </button>
            <button 
              className={filter === 'new_application' ? 'active' : ''}
              onClick={() => setFilter('new_application')}
            >
              בקשות חדשות
            </button>
          </div>

          <div className="notification-list">
            {filteredNotifications.length === 0 ? (
              <div className="no-notifications">
                <i className="fas fa-bell-slash"></i>
                <p>אין התראות להצגה</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-icon-wrapper">
                      <span 
                        className="notification-icon"
                        style={{ color: getNotificationColor(notification.type) }}
                      >
                        {getNotificationIcon(notification.type)}
                      </span>
                      {!notification.read && <div className="unread-dot"></div>}
                    </div>
                    
                    <div className="notification-body">
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      
                      {notification.data && (
                        <div className="notification-details">
                          {notification.data.jobTitle && (
                            <span className="job-title">{notification.data.jobTitle}</span>
                          )}
                          {notification.data.candidateName && (
                            <span className="candidate-name">{notification.data.candidateName}</span>
                          )}
                          {notification.data.status && (
                            <span className={`status-badge ${notification.data.status}`}>
                              {notification.data.status}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="notification-time">
                        {formatTimeAgo(notification.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!isConnected && (
            <div className="connection-status">
              <i className="fas fa-exclamation-triangle"></i>
              <span>אין חיבור לשרת - מנסה להתחבר מחדש...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
