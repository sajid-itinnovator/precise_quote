import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, Clock, ArrowLeft, Search, HelpCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #09122a 0%, #0f172a 100%)',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 24,
        maxWidth: 500,
        width: '100%',
        padding: '40px 32px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        textAlign: 'center',
        border: '1px solid #e2e8f0'
      }}>
        {/* Visual 404 Badge */}
        <div style={{
          display: 'inline-block',
          background: '#eff6ff',
          color: 'var(--primary, #1a56ff)',
          fontSize: '3.5rem',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          padding: '4px 24px',
          borderRadius: 16,
          border: '1px solid #bfdbfe',
          marginBottom: 16
        }}>
          404
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 28px' }}>
          The quotation, project, or page you are looking for might have been removed, renamed, or is temporarily unavailable.
        </p>

        {/* Quick Navigation Action Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#1a56ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '13px 20px',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(26, 86, 255, 0.35)'
            }}
          >
            <Home size={18} /> Go to Dashboard
          </button>

          <button
            onClick={() => navigate('/builder')}
            style={{
              background: '#f8fafc',
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Create New Quotation
          </button>

          <button
            onClick={() => navigate('/history')}
            style={{
              background: '#f8fafc',
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <Clock size={18} /> View Quotation History
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <ArrowLeft size={15} /> Back to Homepage
        </button>
      </div>
    </div>
  );
}
