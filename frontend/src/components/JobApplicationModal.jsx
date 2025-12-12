import React, { useState, useRef } from 'react';
import './JobApplicationModal.css';

const JobApplicationModal = ({ isOpen, onClose, jobDetails, onSubmit, userProfile }) => {
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [useExistingCV, setUseExistingCV] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError('אנא העלה קובץ PDF, DOC או DOCX בלבד');
      return;
    }

    if (file.size > maxSize) {
      setError('גודל הקובץ חייב להיות עד 5MB');
      return;
    }

    setCvFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user has existing CV or new CV
    if (!cvFile && !useExistingCV) {
      if (userProfile?.cv_file) {
        setError('יש לך קורות חיים בפרופיל. סמן "השתמש בקורות חיים קיימים" או העלה קובץ חדש');
      } else {
        setError('חסר קובץ קורות חיים\nאנא העלה קובץ קורות חיים לפני הגשת המועמדות');
      }
      return;
    }
    
    if (useExistingCV && !userProfile?.cv_file) {
      setError('אין קורות חיים בפרופיל שלך. אנא העלה קובץ חדש');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit({
        cvFile: useExistingCV ? null : cvFile,
        useExistingCV,
        coverLetter,
        jobId: jobDetails.id || jobDetails.JobID
      });
      
      // Reset form
      setCvFile(null);
      setCoverLetter('');
      onClose();
    } catch (err) {
      setError(err.message || 'שגיאה בהגשת המועמדות');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setCvFile(null);
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content job-application-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>הגש מועמדות למשרה</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="job-info">
          <h3>{jobDetails?.JobTitle || jobDetails?.title}</h3>
          <p>{jobDetails?.CompanyName || jobDetails?.company_name}</p>
          <p>{jobDetails?.CityName || jobDetails?.location}</p>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-group">
            <label>קורות חיים *</label>
            
            {userProfile?.cv_file && (
              <div className="existing-cv-option">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={useExistingCV}
                    onChange={(e) => {
                      setUseExistingCV(e.target.checked);
                      if (e.target.checked) {
                        setCvFile(null);
                        setError('');
                      }
                    }}
                  />
                  <span>השתמש בקורות החיים הקיימים בפרופיל</span>
                </label>
              </div>
            )}
            
            {!useExistingCV && (
            <div 
              className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {cvFile ? (
                <div className="file-preview">
                  <div className="file-info">
                    <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <div className="file-details">
                      <p className="file-name">{cvFile.name}</p>
                      <p className="file-size">{(cvFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" className="remove-file" onClick={removeFile}>
                      הסר
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-prompt" onClick={() => fileInputRef.current?.click()}>
                  <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="upload-text">גרור קובץ לכאן או לחץ לבחירה</p>
                  <p className="upload-hint">PDF, DOC, DOCX עד 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            )}
          </div>

          <div className="form-group">
            <label>מכתב מקדים (אופציונלי)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="ספר/י על עצמך ומדוע את/ה מתאים/ה למשרה זו..."
              rows="6"
              className="cover-letter-input"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              ביטול
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting || !cvFile}
            >
              {isSubmitting ? 'שולח...' : 'הגש מועמדות'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationModal;
