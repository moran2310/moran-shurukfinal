import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Only log actual errors, not WebSocket connection issues
    if (!error.message?.includes('WebSocket') && !error.message?.includes('reconnectTimeoutRef')) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Don't show error UI for WebSocket errors
      if (this.state.error?.message?.includes('WebSocket') || 
          this.state.error?.message?.includes('reconnectTimeoutRef')) {
        return this.props.children;
      }

      // Fallback UI for other errors
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2>משהו השתבש</h2>
          <p>אירעה שגיאה בטעינת הרכיב. אנא רענן את הדף.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            רענן דף
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
