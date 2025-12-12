import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import { useNotification } from '../../contexts/NotificationContext';
import './Auth.css';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';

const Login = () => {
  const { showError } = useNotification();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Role-based redirect
        const userRole = data.user.role;
        let redirectPath = '/worker-dashboard';
        if (userRole === 'admin') {
          redirectPath = '/admin-dashboard';
        } else if (userRole === 'employer') {
          redirectPath = '/employer-dashboard';
        }
        
        // Store user data in localStorage for navbar access
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          role: userRole,
          first_name: data.user.first_name || data.user.fullName,
          name: data.user.fullName,
          email: data.user.email
        }));
        
        // Redirect using window.location to ensure data is stored
        window.location.href = redirectPath;
      } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = data.message || 'שגיאה בהתחברות';
        document.querySelector('.auth-form').prepend(errorDiv);
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('שגיאה בחיבור לשרת', 'שגיאת התחברות');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>התחברות</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <div className="input-with-icon">
              <span className="input-icon"><FaEnvelope /></span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                dir="ltr"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <div className="password-input-container">
              <span className="input-icon"><FaLock /></span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                dir="ltr"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-button">
            <FaSignInAlt className="btn-icon" />
            התחבר
          </button>
          <div className="auth-links">
            <Link to="/forgot-password">שכחת סיסמה?</Link>
            <Link to="/register">אין לך חשבון? הירשם כאן</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
