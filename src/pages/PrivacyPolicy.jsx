import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Database, Eye, FileText, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/icons/icon-192.png" alt="Logo" style={{ width: 34, height: 34, borderRadius: 8 }} />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>PreciseQuote</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '40px 32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Shield size={28} color="#1a56ff" />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Privacy Policy
            </h1>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: 32 }}>
            Last Updated: September 15, 2026 • Effective Date: September 15, 2026
          </p>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              1. Introduction
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              Precise Quote ("we," "our," or "the Platform") provides an estimation, quotation, and client management SaaS solution for interior design studios, architects, contractors, and renovation professionals. We respect your privacy and are committed to protecting the confidential business data of your studio and your clients.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              2. Information We Collect
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              We collect information strictly necessary to provide the services requested:
            </p>
            <ul style={{ lineHeight: 1.8, color: '#475569', fontSize: '0.94rem', paddingLeft: 20 }}>
              <li><strong>Account Credentials:</strong> Full name, email address, company name, phone number, and password hashes created during registration.</li>
              <li><strong>Third-Party Authentication Data (Google Sign-In):</strong> When you authenticate using Google, we receive basic identity information (name, email address, and profile picture avatar) solely for session authentication. We do not access contacts, Drive, or any private Google account data.</li>
              <li><strong>Business & Studio Data:</strong> Company logo, address, GSTIN, payment terms, and bank details you configure for quotation PDF rendering.</li>
              <li><strong>Client & Quotation Records:</strong> Customer names, site addresses, phone numbers, quotation line items, and pricing formulas created within your studio workspace.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              3. Multi-Tenant Data Isolation & Confidentiality
            </h2>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 10,
              padding: '16px 18px',
              marginBottom: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1e40af', marginBottom: 4, fontSize: '0.95rem' }}>
                <Lock size={18} /> Strict Tenant Boundary Guarantee
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#1e3a8a', lineHeight: 1.6 }}>
                Each studio operates in an isolated tenant environment. Your quotations, client lists, profit margins, and custom pricing are strictly isolated and are never shared, sold, aggregated, or accessible to any other tenant or third party.
              </p>
            </div>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              We will never monetize your client lists or competitive pricing data. Your data belongs 100% to your studio.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              4. Data Storage, Security & Encryption
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              Your data is stored securely in encrypted Google Cloud Firestore databases utilizing TLS 1.3 encryption in transit and AES-256 encryption at rest. Database access is governed by granular security rules verifying authenticated user identity and tenant ownership for every read, write, update, and delete operation.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              5. Local Storage & Offline Caching
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              As a Progressive Web App (PWA), Precise Quote stores application shell assets and user preferences in browser Local Storage and Service Worker cache to facilitate offline operation, rapid screen rendering, and fast quotation generation on mobile devices.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              6. Your Rights & Data Export
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              You retain full ownership of your data. You have the right to access, update, export, or request the permanent deletion of your studio records at any time by contacting our support team or through your admin console.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              7. Contact Us
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              If you have any questions regarding this Privacy Policy or our security practices, please contact us:
            </p>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <Mail size={20} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Precise Quote Privacy Desk</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>support@precisequote.web.app</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
