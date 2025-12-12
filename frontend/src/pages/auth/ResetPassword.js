import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const resetToken = params.get('token');
    if (!resetToken) {
      alert('קישור לא תקין');
      navigate('/login');
      return;
    }
    setToken(resetToken);
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('הסיסמאות אינן תואמות');
      return;
    }

    if (password.length < 6) {
      alert('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('הסיסמה עודכנה בהצלחה');
        navigate('/login');
      } else {
        alert(data.message || 'שגיאה באיפוס הסיסמה');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      alert('שגיאה בחיבור לשרת');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>איפוס סיסמה</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">סיסמה חדשה</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">אימות סיסמה</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <button type="submit" className="auth-button">עדכן סיסמה</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
