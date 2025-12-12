// App.js
import './utils/consoleCleanup'; // Clean up console warnings
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import UpgradeCV from './pages/UpgradeCV';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import InterviewMistakes from './pages/InterviewMistakes';
import InterviewDress from './pages/InterviewDress';
import CvWriting from './pages/CvWriting';
import InterviewTips from './pages/InterviewTips';
import PersonalGuidance from './pages/PersonalGuidance';
import SalaryComparison from './pages/SalaryComparison';
import WorkerDashboard from './pages/WorkerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SearchResults from './pages/SearchResults';
import EnhancedSearchResults from './pages/EnhancedSearchResults';
import PersonalArea from './pages/PersonalArea';
import JobDetails from './pages/JobDetails';
import './pages/auth/Auth.css';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/upgrade-cv" element={<UpgradeCV />} />
              <Route path="/articles/interview-mistakes" element={<InterviewMistakes />} />
              <Route path="/articles/interview-dress" element={<InterviewDress />} />
              <Route path="/articles/cv-writing" element={<CvWriting />} />
              <Route path="/articles/interview-tips" element={<InterviewTips />} />
              <Route path="/personal-guidance" element={<PersonalGuidance />} />
              <Route path="/salary-comparison" element={<SalaryComparison />} />
              <Route path="/worker-dashboard" element={<WorkerDashboard />} />
              <Route path="/employer-dashboard" element={<EmployerDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/personal-area" element={<PersonalArea />} />
              <Route path="/search-results" element={<SearchResults />} />
              <Route path="/enhanced-search" element={<EnhancedSearchResults />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/personal-area" element={<PersonalArea />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
