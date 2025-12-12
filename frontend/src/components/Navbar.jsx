import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import './Navbar.css';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    // Check on mount
    checkAuthStatus();

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);
    
    // Custom event for same-tab login/logout
    window.addEventListener('authStateChanged', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authStateChanged', checkAuthStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const getProfileLink = () => {
    if (user?.role === 'worker') return '/worker-dashboard';
    if (user?.role === 'employer') return '/employer-dashboard';
    if (user?.role === 'admin') return '/admin-dashboard';
    return '/personal-area';
  };

  return (
    <nav className="top-navbar">
      <div className="logo">
        <Link to="/">הצעד הבא בקריירה</Link>
      </div>
      
      <div className="nav-center">
        <Link to="/" className="nav-link">
          <i className="fas fa-home"></i>
          דף הבית
        </Link>
        <Link to="/enhanced-search" className="nav-link">
          <i className="fas fa-search"></i>
          חיפוש מתקדם
        </Link>
      </div>

      <div className="nav-right">
        {isLoggedIn ? (
          <div className="user-section">
            <NotificationCenter 
              userId={user?.id} 
              userRole={user?.role} 
            />
            <div className="user-info">
              <div className="user-profile">
                <Link to={getProfileLink()} className="user-name-link">
                  {user?.first_name || user?.name || 'משתמש'}
                </Link>
                <button className="logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login">
              <button className="login-btn">
                <i className="fas fa-sign-in-alt"></i>
                התחברות
              </button>
            </Link>
            <Link to="/register">
              <button className="signup-btn">
                <i className="fas fa-user-plus"></i>
                הרשמה
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
