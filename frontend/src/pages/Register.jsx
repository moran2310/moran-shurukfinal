import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // כאן יהיה הטיפול בהרשמה
    console.log('נתוני הרשמה:', formData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>הרשמה</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">שם מלא</label>
            <div className="input-container">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="הכנס את שמך המלא"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <div className="input-container">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="הכנס את האימייל שלך"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <div className="input-container">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className={showPassword ? "password-field" : ""}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="בחר סיסמה"
                minLength="8"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">אימות סיסמה</label>
            <div className="input-container">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={showConfirmPassword ? "password-field" : ""}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="הכנס את הסיסמה שוב"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? "הסתר סיסמה" : "הצג סיסמה"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="role">סוג משתמש</label>
            <div className="input-container">
              <FaUser className="input-icon" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="worker">עובד/מחפש עבודה</option>
                <option value="employer">מעסיק/חברה</option>
                {/* Allow registration of administrators.  Only trusted users should
                   select this option as it grants full control over job postings
                   and user management in the system. */}
                <option value="admin">מנהל</option>
              </select>
            </div>
          </div>
          <button type="submit" className="submit-btn">
            <FaUserPlus className="btn-icon" />
            הירשם
          </button>
        </form>
        <div className="login-link">
          כבר יש לך חשבון?{' '}
          <Link to="/login">התחבר כאן</Link>
        </div>
      </div>
    </div>
  );
}
