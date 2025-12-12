import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPaperPlane, FaArrowLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ text: 'נא להזין כתובת אימייל', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setMessage({ text: response.data.message, isError: false });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'אירעה שגיאה בשליחת בקשת איפוס סיסמה';
      setMessage({ text: errorMessage, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h1>שחזור סיסמה</h1>
        
        {message.text && (
          <div className={`message ${message.isError ? 'error' : 'success'}`}>
            {message.isError ? (
              <FaExclamationCircle className="message-icon" />
            ) : (
              <FaCheckCircle className="message-icon" />
            )}
            <span>{message.text}</span>
          </div>
        )}
        
        <p className="instructions">
          הכנס את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <div className="input-container">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="הכנס את האימייל שלך"
                disabled={loading}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <FaPaperPlane className="btn-icon" />
                שלח קישור לאיפוס
              </>
            )}
          </button>
        </form>
        
        <div className="back-to-login">
          <Link to="/login" onClick={(e) => !loading || e.preventDefault()}>
            <FaArrowLeft className="link-icon" />
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
}
