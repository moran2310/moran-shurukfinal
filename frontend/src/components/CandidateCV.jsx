import React from 'react';
import { 
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Star as StarIcon
} from '@mui/icons-material';
import './CandidateCV.css';

const CandidateCV = ({ candidate }) => {
  return (
    <div className="cv-viewer">
      <div className="cv-header">
        <div className="candidate-profile">
          <div className="profile-image">
            {candidate.profileImage ? (
              <img src={candidate.profileImage} alt={candidate.name} />
            ) : (
              <PersonIcon className="default-avatar" />
            )}
          </div>
          <div className="profile-info">
            <h2>{candidate.name}</h2>
            <div className="contact-details">
              <span><EmailIcon /> {candidate.email}</span>
              <span><PhoneIcon /> {candidate.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cv-sections">
        <section className="cv-section">
          <h3><WorkIcon /> ניסיון תעסוקתי</h3>
          {candidate.experience.map((exp, index) => (
            <div key={index} className="experience-item">
              <div className="experience-header">
                <h4>{exp.title}</h4>
                <span className="company">{exp.company}</span>
              </div>
              <div className="experience-period">
                {exp.startDate} - {exp.endDate || 'כיום'}
              </div>
              <p className="experience-description">{exp.description}</p>
            </div>
          ))}
        </section>

        <section className="cv-section">
          <h3><SchoolIcon /> השכלה</h3>
          {candidate.education.map((edu, index) => (
            <div key={index} className="education-item">
              <div className="education-header">
                <h4>{edu.degree}</h4>
                <span className="institution">{edu.institution}</span>
              </div>
              <div className="education-period">
                {edu.startYear} - {edu.endYear || 'כיום'}
              </div>
              {edu.description && (
                <p className="education-description">{edu.description}</p>
              )}
            </div>
          ))}
        </section>

        <section className="cv-section">
          <h3><StarIcon /> כישורים</h3>
          <div className="skills-grid">
            {candidate.skills.map((skill, index) => (
              <div key={index} className="skill-item">
                <span className="skill-name">{skill.name}</span>
                <div className="skill-level" data-level={skill.level}>
                  <div className="level-bar" style={{ width: `${skill.level * 20}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CandidateCV;
