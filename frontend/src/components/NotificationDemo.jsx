import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationDemo = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const handleSuccess = () => {
    showSuccess('פרופיל נשמר בהצלחה ועודכן במערכת!', 'הצלחה!');
  };

  const handleError = () => {
    showError('שגיאה בחיבור לשרת. אנא נסה שוב מאוחר יותר.', 'שגיאה!');
  };

  const handleWarning = () => {
    showWarning('אנא העלה קובץ קורות חיים לפני הגשת המועמדות.', 'אזהרה!');
  };

  const handleInfo = () => {
    showInfo('מועמדותך הוגשה ותישלח לבדיקת המעסיק בקרוב.', 'מידע');
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <button 
        onClick={handleSuccess}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        הצג הודעת הצלחה
      </button>
      
      <button 
        onClick={handleError}
        style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        הצג הודעת שגיאה
      </button>
      
      <button 
        onClick={handleWarning}
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        הצג הודעת אזהרה
      </button>
      
      <button 
        onClick={handleInfo}
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        הצג הודעת מידע
      </button>
    </div>
  );
};

export default NotificationDemo;
