import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, 
  FaExclamationCircle 
} from 'react-icons/fa';
import './CustomNotification.css';

const CustomNotification = ({ 
  show, 
  onClose, 
  type = 'success', 
  title, 
  message, 
  duration = 4000,
  showCloseButton = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon success-icon" />;
      case 'error':
        return <FaExclamationCircle className="notification-icon error-icon" />;
      case 'warning':
        return <FaExclamationTriangle className="notification-icon warning-icon" />;
      case 'info':
        return <FaInfoCircle className="notification-icon info-icon" />;
      default:
        return <FaInfoCircle className="notification-icon info-icon" />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'error':
        return 'notification-error';
      case 'warning':
        return 'notification-warning';
      case 'info':
        return 'notification-info';
      default:
        return 'notification-info';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`notification-overlay ${isAnimating ? 'show' : ''}`}>
      <div className={`custom-notification ${getTypeClass()} ${isAnimating ? 'slide-in' : ''}`}>
        <div className="notification-content">
          <div className="notification-header">
            {getIcon()}
            <div className="notification-text">
              {title && <h4 className="notification-title">{title}</h4>}
              <p className="notification-message">{message}</p>
            </div>
            {showCloseButton && (
              <button 
                className="notification-close" 
                onClick={handleClose}
                aria-label="Close notification"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
        <div className={`notification-progress ${type}`}></div>
      </div>
    </div>
  );
};

export default CustomNotification;
