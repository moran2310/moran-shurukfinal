import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement password reset logic
    console.log('Password reset requested for:', email);
    setSubmitted(true);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>שחזור סיסמה</h2>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">אימייל</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <button type="submit" className="auth-button">שלח קישור לאיפוס סיסמה</button>
            <div className="auth-links">
              <Link to="/login">חזרה להתחברות</Link>
            </div>
          </form>
        ) : (
          <div className="success-message">
            <p>הוראות לאיפוס הסיסמה נשלחו לכתובת האימייל שלך.</p>
            <div className="auth-links">
              <Link to="/login">חזרה להתחברות</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
