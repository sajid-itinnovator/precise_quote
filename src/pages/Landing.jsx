import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LayoutDashboard, FileText, Smartphone } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Inter, sans-serif' }}>
      {/* Navigation */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #eaeaea' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: '#1a56ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 20 }}>
            P
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>PreciseQuote</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#1e293b', fontWeight: 600, cursor: 'pointer', padding: '8px 16px' }}>
            Login
          </button>
          <button onClick={() => navigate('/login')} style={{ background: '#1a56ff', border: 'none', color: '#fff', fontWeight: 600, borderRadius: 6, cursor: 'pointer', padding: '8px 20px' }}>
            Start for Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '100px 20px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em' }}>
          The Ultimate SaaS Platform for <span style={{ color: '#1a56ff' }}>Interior Designers</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#475569', marginBottom: 40, maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Generate professional quotations, manage clients, and track projects in minutes. Fully white-labeled with your own branding.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: '#1a56ff', border: 'none', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: 8, cursor: 'pointer', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(26, 86, 255, 0.4)' }}>
            Start your Workspace <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: 60, color: '#0f172a' }}>Everything you need to scale</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
            <div style={{ padding: 30, background: '#f8f9fa', borderRadius: 16, border: '1px solid #eaeaea' }}>
              <FileText size={40} color="var(--primary)" style={{ marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Lightning Fast Quotes</h3>
              <p style={{ color: '#475569', lineHeight: 1.6 }}>Build comprehensive, room-by-room quotations using presets in seconds, not hours.</p>
            </div>
            
            <div style={{ padding: 30, background: '#f8f9fa', borderRadius: 16, border: '1px solid #eaeaea' }}>
              <LayoutDashboard size={40} color="var(--primary)" style={{ marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>White-Label PDFs</h3>
              <p style={{ color: '#475569', lineHeight: 1.6 }}>Generate beautiful PDF proposals branded with your company's logo and contact details.</p>
            </div>

            <div style={{ padding: 30, background: '#f8f9fa', borderRadius: 16, border: '1px solid #eaeaea' }}>
              <Smartphone size={40} color="var(--primary)" style={{ marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Team Management</h3>
              <p style={{ color: '#475569', lineHeight: 1.6 }}>Invite employees, manage data access, and keep your entire team on the same page.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '100px 20px', background: 'var(--secondary)', color: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 60 }}>Simple, Transparent Pricing</h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap' }}>
            {/* Free Tier */}
            <div style={{ background: '#fff', color: '#1e293b', padding: 40, borderRadius: 16, width: 350, textAlign: 'left', border: '1px solid #eaeaea' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 10 }}>1 Month Trial</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 20 }}>₹0<span style={{ fontSize: '1rem', color: '#475569' }}>/first month</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckCircle2 size={18} color="#1a56ff" /> 30-Day Full Access</li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckCircle2 size={18} color="#1a56ff" /> Unlimited Quotations</li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckCircle2 size={18} color="#1a56ff" /> Custom Branding & Logo</li>
              </ul>
              <button onClick={() => navigate('/login')} style={{ width: '100%', padding: 14, background: '#f8f9fa', border: '1px solid #ccc', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Start Free Trial
              </button>
            </div>

            {/* Pro Tier */}
            <div style={{ background: '#1a56ff', color: '#fff', padding: 40, borderRadius: 16, width: 350, textAlign: 'left', transform: 'scale(1.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, display: 'inline-block', marginBottom: 10 }}>MOST POPULAR</div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 10 }}>Pro</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 20 }}>₹699<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckCircle2 size={18} color="#fff" /> Unlimited Quotations</li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckCircle2 size={18} color="#fff" /> Unlimited Team Members</li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckCircle2 size={18} color="#fff" /> Dedicated Support</li>
              </ul>
              <button onClick={() => navigate('/login')} style={{ width: '100%', padding: 14, background: '#fff', color: '#1a56ff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
        <p>© {new Date().getFullYear()} PreciseQuote SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}
