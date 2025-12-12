import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// פשוט מוחקים את השורות האלו:
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
