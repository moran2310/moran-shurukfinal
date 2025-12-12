import React from 'react';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import './EmployerManagement.css';

const EmployerManagement = () => {
  const employers = [
    {
      id: 1,
      name: 'חברת טכנולוגיות ABC',
      contactName: 'דוד לוי',
      email: 'david@abc-tech.co.il',
      phone: '03-1234567',
      location: 'תל אביב',
      activeJobs: [
        { id: 1, title: 'מפתח Full Stack', department: 'פיתוח', status: 'פתוח' },
        { id: 2, title: 'מנהל מוצר', department: 'מוצר', status: 'פתוח' }
      ]
    },
    {
      id: 2,
      name: 'סטארטאפ XYZ',
      contactName: 'מיכל כהן',
      email: 'michal@xyz.co.il',
      phone: '054-7654321',
      location: 'הרצליה',
      activeJobs: [
        { id: 3, title: 'מעצב/ת UI/UX', department: 'עיצוב', status: 'פתוח' }
      ]
    },
    {
      id: 3,
      name: 'חברת DEF בע"מ',
      contactName: 'יוסי אברהם',
      email: 'yossi@def.co.il',
      phone: '09-8765432',
      location: 'רעננה',
      activeJobs: [
        { id: 4, title: 'מהנדס/ת תוכנה', department: 'פיתוח', status: 'פתוח' },
        { id: 5, title: 'מנהל/ת שיווק', department: 'שיווק', status: 'פתוח' }
      ]
    }
  ];

  const renderEmployerCard = (employer) => (
    <div key={employer.id} className="employer-card">
      <div className="employer-header">
        <BusinessIcon className="employer-avatar" />
        <div className="employer-info">
          <h3>{employer.name}</h3>
          <span className="contact-name">{employer.contactName}</span>
        </div>
      </div>
      
      <div className="contact-info">
        <div className="info-row">
          <EmailIcon />
          <span>{employer.email}</span>
        </div>
        <div className="info-row">
          <PhoneIcon />
          <span>{employer.phone}</span>
        </div>
        <div className="info-row">
          <BusinessIcon />
          <span>{employer.location}</span>
        </div>
      </div>

      <div className="active-jobs">
        <h4>משרות פעילות</h4>
        {employer.activeJobs.map(job => (
          <div key={job.id} className="job-item">
            <WorkIcon />
            <div className="job-details">
              <span className="job-title">{job.title}</span>
              <span className="job-department">{job.department}</span>
            </div>
            <span className="job-status">{job.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="employer-management">
      <h2>ניהול מעסיקים</h2>
      <div className="employers-grid">
        {employers.map(renderEmployerCard)}
      </div>
    </div>
  );
};

export default EmployerManagement;
