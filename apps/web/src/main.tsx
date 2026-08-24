import React, { Component, ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
  '759100394487-7979d2crm851j253nm2rhf12ugdv2avi.apps.googleusercontent.com';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', backgroundColor: '#F0EDE4', color: '#1C1917', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#059669', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>SECURECLOUD SYSTEM RECOVERY</h1>
          <p style={{ marginBottom: '24px', maxWidth: '600px', textAlign: 'center', fontSize: '14px', color: '#57534e' }}>
            {this.state.error?.message || 'A browser runtime error occurred.'}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/';
            }}
            style={{ padding: '12px 24px', backgroundColor: '#059669', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace' }}
          >
            CLEAR LOCAL CACHE & RELOAD
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
