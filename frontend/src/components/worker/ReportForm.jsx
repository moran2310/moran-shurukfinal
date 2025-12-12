import React, { useState } from 'react';
import './ReportForm.css';

const ReportForm = ({ onClose, onSubmit }) => {
  const [reportData, setReportData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!reportData.subject || !reportData.message) {
      setError('נא למלא את כל השדות החובה');
      return;
    }

    try {
      setIsSubmitting(true);
      // Here you would typically make an API call to submit the report
      // For now, we'll just log it and call the onSubmit callback
      console.log('Submitting report:', reportData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      if (onSubmit) {
        onSubmit(reportData);
      }
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('אירעה שגיאה בשליחת הדווח. נא לנסות שוב מאוחר יותר.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-form-container">
      <div className="report-form-header">
        <h2>כתיבת דווח</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label htmlFor="category">קטגוריה <span className="required">*</span></label>
          <select
            id="category"
            name="category"
            value={reportData.category}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="general">כללי</option>
            <option value="technical">בעיה טכנית</option>
            <option value="account">בעיה בחשבון</option>
            <option value="suggestion">הצעה לשיפור</option>
            <option value="other">אחר</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="subject">נושא <span className="required">*</span></label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={reportData.subject}
            onChange={handleChange}
            className="form-control"
            placeholder="הזן נושא הדווח"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="priority">דחיפות</label>
          <select
            id="priority"
            name="priority"
            value={reportData.priority}
            onChange={handleChange}
            className="form-control"
          >
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
            <option value="critical">דחוף</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="message">תיאור הבעיה <span className="required">*</span></label>
          <textarea
            id="message"
            name="message"
            value={reportData.message}
            onChange={handleChange}
            className="form-control"
            rows="5"
            placeholder="נא לתאר את הבעיה או השאלה שלך בפירוט"
            required
          ></textarea>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ביטול
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'שולח...' : 'שלח דווח'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
