import React from 'react';
import { FaDownload } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './WorkerQuickActions.css';

const WorkerQuickActions = ({ profile, showError }) => {

  // Handle CV Download
  const handleCVDownload = () => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      // Set up the change event handler
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
          const formData = new FormData();
          formData.append('cv', file);
          
          const token = localStorage.getItem('token');
          if (!token) {
            showError('נא התחבר מחדש למערכת');
            return;
          }
          
          showError('מעלה את קובץ קורות החיים...', 'info');
          
          const response = await fetch(`${API_BASE_URL}/api/worker/upload-cv`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (!response.ok) {
            throw new Error('שגיאה בהעלאת הקובץ');
          }
          
          const result = await response.json();
          showError('קובץ קורות החיים הועלה בהצלחה!', 'success');
          
        } catch (error) {
          console.error('Upload Error:', error);
          showError(error.message || 'אירעה שגיאה בהעלאת הקובץ. נסה שוב.');
        }
      };
      
      // Trigger the file dialog
      input.click();
      
    } catch (error) {
      console.error('Error:', error);
      showError('אירעה שגיאה. נסה שוב.');
    }
  };

  return (
    <div className="quick-actions">
      <div className="quick-actions-grid">
        <button 
          className="quick-action-btn" 
          onClick={handleCVDownload}
          title="העלאת קורות חיים"
        >
          <FaDownload className="quick-action-icon" />
          <span>העלאת קורות חיים</span>
        </button>
      </div>
    </div>
  );
};

export default WorkerQuickActions;
