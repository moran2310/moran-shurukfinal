import React from 'react';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import DescriptionIcon from '@mui/icons-material/Description';
import './CandidateManagement.css';

const CandidateManagement = () => {
  const candidates = [
    {
      id: 1,
      name: 'דוד כהן',
      email: 'david@example.com',
      phone: '050-1234567',
      hasResume: true,
      interviews: [
        { date: '2024-01-18', company: 'טכנולוגיות ABC', status: 'completed' }
      ]
    },
    {
      id: 2,
      name: 'מיכל לוי',
      email: 'michal@example.com',
      phone: '052-7654321',
      hasResume: false,
      interviews: [
        { date: '2024-01-19', company: 'סטארטאפ XYZ', status: 'scheduled' }
      ]
    },
    {
      id: 3,
      name: 'יוסי אברהם',
      email: 'yossi@example.com',
      phone: '053-9876543',
      hasResume: true,
      interviews: []
    },
    {
      id: 4,
      name: 'רות כהן',
      email: 'ruth@example.com',
      phone: '054-3456789',
      hasResume: true,
      interviews: []
    }
  ];


  const renderCandidateCard = (candidate) => (
    <div className="candidate-card">
      <div className="candidate-header">
        <PersonIcon className="candidate-avatar" />
        <div className="candidate-info">
          <h3>{candidate.name}</h3>
        </div>
      </div>

      <div className="contact-info">
        <div className="info-item">
          <EmailIcon />
          <span>{candidate.email}</span>
        </div>
        <div className="info-item">
          <PhoneIcon />
          <span>{candidate.phone}</span>
        </div>
      </div>

      {candidate.hasResume ? (
        <button 
          className="view-resume-btn"
          onClick={() => window.open(`/api/resumes/${candidate.id}`)}
        >
          <DescriptionIcon />
          צפה בקורות חיים
        </button>
      ) : (
        <p className="no-resume-text">טרם הועלו קורות חיים</p>
      )}
    </div>
  );

  return (
    <div className="candidate-management">
      <div className="section-header">
        <h2>ניהול מועמדים</h2>
      </div>
      
      <div className="candidates-grid">
        {candidates.map(candidate => (
          <div key={candidate.id}>
            {renderCandidateCard(candidate)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateManagement;
