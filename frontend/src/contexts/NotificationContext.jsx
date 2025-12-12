import React, { createContext, useContext, useState } from 'react';
import CustomNotification from '../components/CustomNotification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = ({ 
    type = 'info', 
    title, 
    message, 
    duration = 4000 
  }) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      title,
      message,
      duration,
      show: true
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration + animation time
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration + 500);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Convenience methods
  const showSuccess = (message, title = 'הצלחה!') => {
    return showNotification({ type: 'success', title, message });
  };

  const showError = (message, title = 'שגיאה!') => {
    return showNotification({ type: 'error', title, message });
  };

  const showWarning = (message, title = 'אזהרה!') => {
    return showNotification({ type: 'warning', title, message });
  };

  const showInfo = (message, title = 'מידע') => {
    return showNotification({ type: 'info', title, message });
  };

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notifications-container">
        {notifications.map((notification) => (
          <CustomNotification
            key={notification.id}
            show={notification.show}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
