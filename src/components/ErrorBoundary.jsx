import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PreciseQuote ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1636 0%, #0f172a 100%)',
          padding: '24px 16px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 520,
            width: '100%',
            padding: '36px 28px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fef2f2',
              border: '2px solid #fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 24px' }}>
              We encountered an unexpected error in the studio. Your data is safe in the cloud. You can reload the page or return to the dashboard.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#1a56ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(26, 86, 255, 0.3)'
                }}
              >
                <RefreshCw size={16} /> Reload Studio
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '12px 20px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                <Home size={16} /> Go to Dashboard
              </button>
            </div>

            {/* Diagnostic Collapsible Details */}
            {this.state.error && (
              <div style={{ textAlign: 'left', marginTop: 16 }}>
                <button
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                    margin: '0 auto'
                  }}
                >
                  <span>Technical details</span>
                  {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {this.state.showDetails && (
                  <div style={{
                    marginTop: 10,
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: '12px 14px',
                    borderRadius: 8,
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    maxHeight: 180
                  }}>
                    <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 4 }}>
                      {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo?.componentStack}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
