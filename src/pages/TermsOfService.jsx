import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, Scale, Mail } from 'lucide-react';

export default function TermsOfService() {
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
            <Scale size={28} color="#1a56ff" />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Terms of Service
            </h1>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: 32 }}>
            Last Updated: September 15, 2026 • Effective Date: September 15, 2026
          </p>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              By accessing, registering for, installing, or using the <strong>Precise Quote</strong> platform ("Service"), available at precisequote.web.app or through our mobile applications, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              2. Description of the Service
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              Precise Quote provides cloud-based estimation, quotation building, project rate calculations, PDF invoice generation, and client management software designed specifically for interior design studios, architects, contractors, and renovation specialists.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              3. User Accounts & Workspace Administration
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              When creating an account, you must provide accurate, complete, and current information. The account creator is designated as the Workspace Admin. Admins may invite team members and designate permissions (shared vs. private client access). You are responsible for safeguarding your login credentials and for all activities conducted under your workspace.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              4. Intellectual Property & Ownership of Quotations
            </h2>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              padding: '16px 18px',
              marginBottom: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#166534', marginBottom: 4, fontSize: '0.95rem' }}>
                <ShieldCheck size={18} /> 100% Studio Ownership
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#14532d', lineHeight: 1.6 }}>
                You retain all rights, title, and intellectual property ownership of your quotations, design estimates, customer lists, brand assets, and custom product catalogs created on the platform. Precise Quote claims no ownership over your business content.
              </p>
            </div>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              You may white-label generated proposals and invoices with your studio's logo, colors, and legal details, and present them directly to your prospective clients.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              5. Free Trials, Subscriptions & Billing
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              New studio workspaces receive a 30-day complimentary trial with unlimited quotations and full features. Following the trial period, continued access requires an active paid subscription (e.g., Pro Plan at ₹699/month or relevant annual billing). Subscription fees are billed in advance on a recurring monthly or annual basis.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              6. Professional Contractor Disclaimer
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              Precise Quote provides mathematical estimation calculations based on the dimensions, unit rates, taxes, and formulas entered by the user. The accuracy of measurements, unit prices, on-site feasibility, and contractual terms agreed with clients remains the sole responsibility of the interior contractor or studio.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              7. Termination & Account Deletion
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              You may cancel your subscription or terminate your account at any time. Upon termination, you will have the opportunity to export your quotation records.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
              8. Contact Information
            </h2>
            <p style={{ lineHeight: 1.7, color: '#475569', fontSize: '0.94rem' }}>
              For legal inquiries, terms compliance, or enterprise agreements, please contact:
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
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Precise Quote Legal Support</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>legal@precisequote.web.app</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
