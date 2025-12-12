import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'worker'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('הסיסמאות אינן תואמות');
      return;
    }

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role
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
        
        // Store minimal user data
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('userName', data.user.fullName);
        
        // Redirect using window.location to ensure cookie is set
        window.location.href = redirectPath;
      } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = data.message || 'שגיאה בהרשמה';
        document.querySelector('.auth-form').prepend(errorDiv);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('שגיאה בחיבור לשרת');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>הרשמה</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="firstName">שם פרטי</label>
            <div className="input-with-icon">
              <span className="input-icon"><FaUser /></span>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="lastName">שם משפחה</label>
            <div className="input-with-icon">
              <span className="input-icon"><FaUser /></span>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
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
            <label htmlFor="role">סוג משתמש</label>
            <div className="input-with-icon">
              <span className="input-icon"><FaUser /></span>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="worker">עובד/מחפש עבודה</option>
                <option value="employer">מעסיק/חברה</option>
                {/* Expose the admin role for trusted users. Selecting this will
                   create an administrator account with full system privileges. */}
                <option value="admin">מנהל</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <div className="password-input-container">
              <span className="input-icon"><FaLock /></span>
              <input
                type={showPassword ? 'text' : 'password'}
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
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">אימות סיסמה</label>
            <div className="password-input-container">
              <span className="input-icon"><FaLock /></span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                dir="ltr"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-button">
            <FaUserPlus className="btn-icon" />
            הרשם
          </button>
          <div className="auth-links">
            <Link to="/login">יש לך כבר חשבון? התחבר כאן</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
