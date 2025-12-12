import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Button, Card, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { FaHome, FaUser, FaEnvelope, FaPhone, FaUserTie, FaUserCog } from 'react-icons/fa';
import './PersonalArea.css';

const PersonalArea = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (user?.role === 'worker') return '/worker-dashboard';
    if (user?.role === 'employer') return '/employer-dashboard';
    if (user?.role === 'admin') return '/admin-dashboard';
    return '/';
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">טוען...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          יש להתחבר כדי לצפות באזור האישי
        </div>
      </div>
    );
  }

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>אזור אישי</h1>
        <Button 
          as={Link} 
          to={getDashboardLink()} 
          variant="outline-secondary" 
          className="d-flex align-items-center gap-2 home-button"
        >
          <FaHome className="me-1" />
          <span>לדשבורד שלי</span>
        </Button>
      </div>
      
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center mb-4">
            <div className="me-3">
              {user.role === 'admin' ? (
                <FaUserCog size={48} className="text-primary" />
              ) : user.role === 'employer' ? (
                <FaUserTie size={48} className="text-primary" />
              ) : (
                <FaUser size={48} className="text-primary" />
              )}
            </div>
            <div>
              <h2 className="mb-1">שלום {user.first_name || user.name}!</h2>
              <p className="text-muted mb-0">
                {user.role === 'worker' && 'מחפש/ת עבודה'}
                {user.role === 'employer' && 'מעסיק/ה'}
                {user.role === 'admin' && 'מנהל מערכת'}
              </p>
            </div>
          </div>
          
          <Card.Text className="mb-4">
            ברוך הבא לאזור האישי שלך. כאן תוכל לצפות בפרטים האישיים שלך, 
            {user.role === 'worker' && 'בקורות החיים וההגשות שלך למשרות.'}
            {user.role === 'employer' && 'בפרטי החברה והמשרות שפירסמת.'}
            {user.role === 'admin' && 'בסטטיסטיקות וניהול המשתמשים במערכת.'}
          </Card.Text>
          
          <h4 className="mb-3">פרטי משתמש:</h4>
          <ListGroup variant="flush" className="mb-4">
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>שם מלא:</span>
              <span className="fw-medium">{user.first_name} {user.last_name || ''}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>אימייל:</span>
              <span className="fw-medium">{user.email}</span>
            </ListGroup.Item>
            {user.phone && (
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <span>טלפון:</span>
                <span className="fw-medium">{user.phone}</span>
              </ListGroup.Item>
            )}
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>סוג משתמש:</span>
              <span className="badge bg-primary">
                {user.role === 'worker' && 'עובד/ת'}
                {user.role === 'employer' && 'מעסיק/ה'}
                {user.role === 'admin' && 'מנהל מערכת'}
              </span>
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PersonalArea;
