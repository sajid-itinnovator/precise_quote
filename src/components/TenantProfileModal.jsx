import React from 'react';
import Modal from '../components/Modal';

/**
 * Tenant Detailed Profile & Plan Management modal — extracted from SuperAdmin.
 * Owns presentation only; every mutation is a callback prop.
 */
export default function TenantProfileModal({
  tenant: selectedTenant,
  onClose,
  actionLoading,
  actionSuccess,
  loadingCreditAmount,
  onAddCredits,
  onUpgradePro,
  onExtendTrial,
  formatDate,
}) {
  return (
      <Modal
        onClose={onClose}
        zLevel={9999}
        className="nested-modal-panel"
        maxWidth={580}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out'
        }}
        overlayStyle={{ padding: 16 }}
      >
          {/* Modal Header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            flexShrink: 0
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Tenant Official Business Profile
              </h3>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                Tenant ID: <span style={{ fontFamily: 'monospace' }}>{selectedTenant.tenantId}</span>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              style={{
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {actionSuccess && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                padding: '12px 16px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* 4 Required Official Business Information Cards */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '18px',
              marginBottom: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
            }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Official Tenant Information
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 1) Name */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>1) Studio / Tenant Name</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedTenant.tenantName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Admin In-Charge: <strong>{selectedTenant.admin?.name || 'Administrator'}</strong>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <a
                        href={`https://${(selectedTenant.tenantName || selectedTenant.tenantId).toLowerCase().replace(/[^a-z0-9]/g, '')}.precisequote.web.app`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.76rem',
                          color: '#0284c7',
                          fontWeight: 700,
                          textDecoration: 'none',
                          background: '#f0f9ff',
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: '1px solid #bae6fd'
                        }}
                      >
                        <Globe size={12} />
                        <span>https://{(selectedTenant.tenantName || selectedTenant.tenantId).toLowerCase().replace(/[^a-z0-9]/g, '')}.precisequote.web.app</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* 2) Official Address */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>2) Official Office Address</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
                      {selectedTenant.officialAddress || 'No official office address configured by tenant yet'}
                    </div>
                    {selectedTenant.officialAddress && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(selectedTenant.officialAddress)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, textDecoration: 'none' }}
                      >
                        Open in Google Maps <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {/* 3) Email ID */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>3) Official Email ID</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                      {selectedTenant.email || 'N/A'}
                    </div>
                    {selectedTenant.email && (
                      <a
                        href={`mailto:${selectedTenant.email}?subject=Precise Quote SaaS Platform Support`}
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, textDecoration: 'none' }}
                      >
                        Send Email <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {/* 4) Phone Number */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>4) Official Phone Number</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                      {selectedTenant.phone || 'No phone number provided yet'}
                    </div>
                    {selectedTenant.phone && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <a
                          href={`tel:${selectedTenant.phone.replace(/[^0-9+]/g, '')}`}
                          style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Phone size={12} /> Call
                        </a>
                        <a
                          href={`https://wa.me/${selectedTenant.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <MessageSquare size={12} /> Chat on WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional GSTIN & Website */}
                {(selectedTenant.gstNumber || selectedTenant.website) && (
                  <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                    {selectedTenant.gstNumber && <div><strong>GSTIN:</strong> {selectedTenant.gstNumber}</div>}
                    {selectedTenant.website && <div><strong>Website:</strong> {selectedTenant.website}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Studio Quotation Credits */}
            <div style={{
              background: '#f8fafc',
              borderRadius: 14,
              padding: '18px',
              border: '1px solid #e2e8f0',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Coins size={16} color="#ea580c" /> Studio Quotation Credits
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Total Allocated: <strong style={{ color: '#0f172a' }}>{selectedTenant.totalCredits || 50}</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase' }}>Spent Credits</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#c2410c', marginTop: 2 }}>
                    {selectedTenant.spentCredits ?? 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#ea580c', marginTop: 2 }}>Quotations Created</div>
                </div>

                <div style={{
                  background: (selectedTenant.balanceCredits ?? 0) <= 5 ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${(selectedTenant.balanceCredits ?? 0) <= 5 ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: 10,
                  padding: '12px 14px'
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    color: (selectedTenant.balanceCredits ?? 0) <= 5 ? '#991b1b' : '#166534',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    Balance Credits
                  </div>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 900,
                    color: (selectedTenant.balanceCredits ?? 0) <= 5 ? '#dc2626' : '#15803d',
                    marginTop: 2
                  }}>
                    {selectedTenant.balanceCredits ?? 0}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: (selectedTenant.balanceCredits ?? 0) <= 5 ? '#ef4444' : '#16a34a',
                    marginTop: 2
                  }}>
                    Remaining Quota
                  </div>
                </div>
              </div>

              {/* Allocate Additional Credits */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Plus size={14} color="#1a56ff" /> Allocate / Recharge Credits
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[25, 50, 100, 250, 500].map(amt => {
                    const isThisLoading = actionLoading && loadingCreditAmount === amt;
                    return (
                      <button
                        key={amt}
                        onClick={() => onAddCredits(amt)}
                        disabled={actionLoading}
                        style={{
                          flex: 1,
                          minWidth: 62,
                          padding: '8px 10px',
                          background: isThisLoading ? '#eff6ff' : '#ffffff',
                          border: isThisLoading ? '1px solid #1a56ff' : '1px solid #cbd5e1',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: isThisLoading ? '#1a56ff' : '#0f172a',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          transition: 'all 0.15s'
                        }}
                      >
                        {isThisLoading ? (
                          <RefreshCw size={12} className="spin" />
                        ) : (
                          `+${amt}`
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Plan Management Section */}
            <div style={{
              background: '#f8fafc',
              borderRadius: 14,
              padding: '18px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Subscription Operations
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.84rem', marginBottom: 16 }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Current Plan:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginTop: 2 }}>
                    {selectedTenant.subscription?.plan || 'Trial'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Expires On:</span>
                  <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                    {selectedTenant.subscription?.trialEndsAt ? formatDate(selectedTenant.subscription.trialEndsAt) : (selectedTenant.subscription?.activeUntil ? formatDate(selectedTenant.subscription.activeUntil) : 'Active')}
                  </div>
                </div>
              </div>

              {/* Extend Trial */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Extend 30-Day Free Trial
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onExtendTrial(15)}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    +15 Days
                  </button>
                  <button
                    onClick={() => onExtendTrial(30)}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    +30 Days
                  </button>
                  <button
                    onClick={() => onExtendTrial(60)}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    +60 Days
                  </button>
                </div>
              </div>

              {/* Activate Pro */}
              <div>
                <button
                  onClick={onUpgradePro}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  <Sparkles size={16} /> Activate 1-Year Pro Plan (₹699/mo)
                </button>
              </div>
            </div>
          </div>
      </Modal>
  );
}
