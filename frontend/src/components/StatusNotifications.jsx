import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import NotificationsIcon from '@mui/icons-material/Notifications';
import './StatusNotifications.css';

const StatusNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // WebSocket connection for real-time updates
  const { data: wsData } = useWebSocket('ws://localhost:5000');

  useEffect(() => {
    if (wsData?.type === 'status_change') {
      const { data } = wsData;
      const newNotification = {
        id: Date.now(),
        message: getStatusMessage(data),
        timestamp: new Date().toISOString(),
        read: false,
        type: data.entityType,
        status: data.newStatus
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  }, [wsData]);

  const getStatusMessage = (data) => {
    const { entityType, entityName, newStatus } = data;
    const statusText = {
      jobs: {
        active: 'פתוחה',
        closed: 'סגורה',
        pending: 'ממתינה לאישור'
      },
      candidates: {
        interviewing: 'בתהליך ראיון',
        hired: 'התקבל/ה לעבודה',
        rejected: 'נדחה/תה'
      }
    };

    return entityType === 'jobs' 
      ? `משרה "${entityName}" ${statusText[entityType][newStatus]}`
      : `מועמד/ת "${entityName}" ${statusText[entityType][newStatus]}`;
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="notifications">
      <button 
        className="notifications-toggle"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <NotificationsIcon />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>התראות</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read"
                onClick={markAllAsRead}
              >
                סמן הכל כנקרא
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">אין התראות חדשות</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString('he-IL')}
                    </span>
                  </div>
                  <div className={`notification-status ${notification.type} ${notification.status}`} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusNotifications;
