import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FaLock, FaCheckCircle, FaExclamationCircle, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [token, setToken] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if token exists in URL
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      // In a real app, you might want to validate the token with the server
      validateToken(urlToken);
    } else {
      setMessage({ 
        text: 'קישור לא תקף. נא לוודא שהקישור שלם או לבקש קישור חדש לאיפוס סיסמה.', 
        isError: true 
      });
      setTokenChecked(true);
    }
  }, [searchParams]);

  const validateToken = async (tokenToValidate) => {
    try {
      // Here you would typically validate the token with your backend
      // For now, we'll just assume it's valid
      setTokenValid(true);
      setTokenChecked(true);
    } catch (error) {
      setMessage({ 
        text: 'קישור לא תקף או שפג תוקפו. נא לבקש קישור חדש לאיפוס סיסמה.', 
        isError: true 
      });
      setTokenValid(false);
      setTokenChecked(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setMessage({ text: 'הסיסמה חייבת להכיל לפחות 6 תווים', isError: true });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({ text: 'הסיסמאות אינן תואמות', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword: password
      });
      
      setMessage({ 
        text: response.data.message || 'הסיסמה אופסה בהצלחה! תועברו לדף ההתחברות...', 
        isError: false 
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'אירעה שגיאה באיפוס הסיסמה. נא לנסות שוב.';
      setMessage({ text: errorMessage, isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (!tokenChecked) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="loading-spinner">
            <FaSpinner className="spinner-icon" />
          </div>
          <p>בודק את הקישור שלך...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="error-message">
            <FaExclamationCircle className="error-icon" />
            <p>{message.text}</p>
          </div>
          <Link 
            to="/forgot-password"
            className="back-button"
          >
            <FaArrowLeft className="back-icon" />
            חזרה לדף איפוס סיסמה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h1>הגדר סיסמה חדשה</h1>
        
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
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">סיסמה חדשה</label>
            <div className="input-container">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="הזן סיסמה חדשה"
                disabled={loading || (message.text && !message.isError)}
                minLength="6"
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? 'הסתר' : 'הצג'}
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">אימות סיסמה</label>
            <div className="input-container">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="הזן שוב את הסיסמה"
                disabled={loading || (message.text && !message.isError)}
                minLength="6"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading || (message.text && !message.isError)}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              'אפס סיסמה'
            )}
          </button>
        </form>
        
        <div className="back-to-login">
          <Link to="/login" onClick={(e) => !loading || e.preventDefault()}>
            <FaArrowLeft className="link-icon" />
            חזרה לדף ההתחברות
          </Link>
        </div>
      </div>
    </div>
  );
}