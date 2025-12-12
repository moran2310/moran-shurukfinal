import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

export default function Login() {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // כאן יהיה הטיפול בהתחברות
    console.log('נתוני התחברות:', formData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>התחברות</h1>
        <form onSubmit={handleSubmit}>
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
            <div className="input-container password-container">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className={showPassword ? "password-field" : ""}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="הכנס את הסיסמה שלך"
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
          <div className="form-links">
            <Link to="/forgot-password" className="forgot-password">
              שכחתי סיסמה
            </Link>
          </div>
          <button type="submit" className="submit-btn">
            <FaSignInAlt className="btn-icon" />
            התחבר
          </button>
        </form>
        <div className="register-link">
          עדיין אין לך חשבון?{' '}
          <Link to="/register">הירשם עכשיו</Link>
        </div>
      </div>
    </div>
  );
}
