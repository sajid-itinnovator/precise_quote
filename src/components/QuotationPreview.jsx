import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Printer, Layers, Pencil, Copy, Lock, MessageSquare, CreditCard, Download } from 'lucide-react';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { buildPrintHTML } from '../utils/printRenderer';
import QuotationDocument from './QuotationDocument';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { DEFAULT_PAYMENT_TERMS, PAYMENT_TERMS_PRESETS } from '../constants/defaults';
import MaterialSpecEditor from './MaterialSpecEditor';
import WhatsAppShareModal from './WhatsAppShareModal';

/**
 * In-app preview modal + print/PDF/WhatsApp actions.
 * Presentation lives in QuotationDocument (single renderer for preview,
 * print, and PDF data paths); this component owns actions and toolbar UI.
 */
export default function QuotationPreview({ quotation, onClose, onUpdateShowItemAmount, onUpdateMaterialSpec, onInvoiceCreated }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { tenantLogo, companyProfile, updateQuotation, updateProject, projects } = useApp();
  const tenantName = userProfile?.tenantName || 'Workspace';

  const [showItemAmount, setShowItemAmount] = useState(
    quotation.showItemAmount !== undefined ? quotation.showItemAmount : true
  );
  const [currentSpec, setCurrentSpec] = useState(quotation.materialSpec || []);
  const [showBrandEditor, setShowBrandEditor] = useState(false);
  const [showPaymentTermsModal, setShowPaymentTermsModal] = useState(false);
  const [currentPaymentTerms, setCurrentPaymentTerms] = useState(
    quotation.paymentTerms !== undefined
      ? quotation.paymentTerms
      : (companyProfile?.paymentTerms || DEFAULT_PAYMENT_TERMS)
  );
  const [tempPaymentTerms, setTempPaymentTerms] = useState(currentPaymentTerms);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(quotation.status || 'DRAFT');

  const handleStatusChange = async (newStatus) => {
    setCurrentStatus(newStatus);
    if (quotation.id && updateQuotation) {
      try {
        await updateQuotation(quotation.id, { status: newStatus });
      } catch (err) {
        console.error('Failed to update quotation status', err);
      }
    }
    // Sync matching project status
    if (projects && updateProject) {
      const qProjTitle = (quotation.projectTitle || '').toLowerCase();
      const matchingProj = projects.find(p =>
        (quotation.projectId && p.id === quotation.projectId) ||
        (p.clientId && quotation.clientId && p.clientId === quotation.clientId) ||
        (p.name && qProjTitle && qProjTitle.includes(p.name.toLowerCase()))
      );
      if (matchingProj) {
        try {
          await updateProject(matchingProj.id, { status: newStatus });
        } catch (err) {
          console.error('Failed to sync project status', err);
        }
      }
    }
  };

  const handleSavePaymentTerms = async (newTerms) => {
    setCurrentPaymentTerms(newTerms);
    setShowPaymentTermsModal(false);
    if (quotation.id && updateQuotation) {
      try {
        await updateQuotation(quotation.id, { paymentTerms: newTerms });
      } catch (err) {
        console.error('Failed to update quotation payment terms', err);
      }
    }
  };

  const handleSpecChange = (newSpec) => {
    setCurrentSpec(newSpec);
    if (onUpdateMaterialSpec) {
      onUpdateMaterialSpec(newSpec);
    }
  };

  const handleDownloadPDF = async () => {
    if (currentStatus === 'DRAFT') {
      await handleStatusChange('INVOICE CREATED');
    }
    if (onInvoiceCreated) {
      onInvoiceCreated();
    }
    const qWithSpec = {
      ...quotation,
      materialSpec: currentSpec,
      status: currentStatus === 'DRAFT' ? 'INVOICE CREATED' : currentStatus,
      paymentTerms: currentPaymentTerms,
      showItemAmount,
    };
    await generateQuotationPDF(qWithSpec, null, companyProfile, tenantName, tenantLogo);
  };

  const handlePrint = async () => {
    // Automatically transition quotation to 'INVOICE CREATED' on printing if draft
    if (currentStatus === 'DRAFT') {
      await handleStatusChange('INVOICE CREATED');
    }
    if (onInvoiceCreated) {
      onInvoiceCreated();
    }

    const qWithSpec = {
      ...quotation,
      materialSpec: currentSpec,
      status: currentStatus === 'DRAFT' ? 'INVOICE CREATED' : currentStatus,
      paymentTerms: currentPaymentTerms,
      showItemAmount,
    };
    const html = buildPrintHTML(qWithSpec, tenantName, tenantLogo, companyProfile, currentPaymentTerms);
    const win = window.open('', '_blank', 'width=900,height=1000,scrollbars=yes');
    if (!win) { toast.error('Please allow popups for this site to print.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();

    win.onload = () => {
      setTimeout(() => {
        win.focus();
        win.print();
      }, 500);
    };
  };

  const currentQuotation = {
    ...quotation,
    materialSpec: currentSpec,
    status: currentStatus,
    paymentTerms: currentPaymentTerms,
    showItemAmount,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', background: 'rgba(5, 10, 25, 0.85)',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#0d1b4b', borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        flexWrap: 'wrap'
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
          padding: '8px 16px', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 600,
          transition: 'background 0.2s'
        }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
           onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
          <X size={16} /> Close Preview
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 220, justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.3px' }}>
            {quotation.clientName} (QT-{quotation.quotationNo})
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600 }}>Status:</span>
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                background: currentStatus === 'APPROVED' ? '#166534'
                          : currentStatus === 'INVOICE CREATED' ? '#1d4ed8'
                          : (currentStatus === 'REJECTED' || currentStatus === 'REJECT') ? '#991b1b'
                          : currentStatus === 'PENDING' ? '#b45309'
                          : '#374151',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
              title="Change invoice and project status"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="INVOICE CREATED">INVOICE CREATED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Action buttons on desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentStatus !== 'APPROVED' ? (
            <button
              type="button"
              onClick={() => {
                navigate(`/builder?edit=${quotation.id}`);
                onClose();
              }}
              style={{
                background: currentStatus === 'DRAFT' ? '#2563eb' : 'rgba(255,255,255,0.15)',
                border: currentStatus === 'DRAFT' ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.25)',
                borderRadius: 6, padding: '7px 14px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700,
                boxShadow: currentStatus === 'DRAFT' ? '0 2px 8px rgba(37,99,235,0.4)' : undefined,
              }}
              title={currentStatus === 'DRAFT' ? "Edit this draft quotation in Builder" : "Edit this invoice in Builder"}
            >
              <Pencil size={14} /> {currentStatus === 'DRAFT' ? 'Edit Draft Invoice' : 'Edit Invoice'}
            </button>
          ) : (
            <span style={{ fontSize: '0.78rem', color: '#93c5fd', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
              <Lock size={13} /> Approved (Locked)
            </span>
          )}

          {quotation.id && (
            <button
              type="button"
              onClick={() => {
                navigate(`/builder?revise=${quotation.id}`);
                onClose();
              }}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 6, padding: '7px 12px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600,
              }}
              title="Create a new revised version of this invoice"
            >
              <Copy size={14} /> Create Revision
            </button>
          )}
        </div>

        {/* Customize Brands button */}
        <button
          type="button"
          onClick={() => setShowBrandEditor(true)}
          style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 6, padding: '7px 14px', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600,
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          title="Customize materials & brands for Page 2 of this invoice"
        >
          <Layers size={15} /> Customize Brands
        </button>

        {/* Customize Payment Terms button */}
        <button
          type="button"
          onClick={() => {
            setTempPaymentTerms(currentPaymentTerms);
            setShowPaymentTermsModal(true);
          }}
          style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 6, padding: '7px 14px', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600,
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          title="Customize milestone payment terms for this invoice"
        >
          <CreditCard size={15} /> Payment Terms
        </button>

        {/* Toggle Show/Hide Item Amounts */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: showItemAmount ? 'rgba(26, 86, 255, 0.3)' : 'rgba(255, 255, 255, 0.12)',
          border: showItemAmount ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)',
          padding: '7px 14px', borderRadius: 6,
          color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
          userSelect: 'none', transition: 'all 0.2s'
        }}>
          <input
            type="checkbox"
            checked={showItemAmount}
            onChange={e => {
              const val = e.target.checked;
              setShowItemAmount(val);
              if (onUpdateShowItemAmount) onUpdateShowItemAmount(val);
            }}
            style={{ accentColor: '#1a56ff', cursor: 'pointer', width: 15, height: 15 }}
          />
          <span>Show Item Amount</span>
        </label>

        {/* Direct Download PDF Button (1-Click, No popup blocker) */}
        <button onClick={handleDownloadPDF} style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: 6,
          padding: '9px 18px', color: '#fff', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.875rem',
          boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
          transition: 'transform 0.15s, background 0.2s'
        }} onMouseOver={e => e.currentTarget.style.background = '#1e40af'}
           onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)'}
           title="Download PDF directly to your device (No popup blocker required)">
          <Download size={16} /> Download PDF
        </button>

        <button onClick={handlePrint} style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6,
          padding: '9px 16px', color: '#fff', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.875rem',
          transition: 'transform 0.15s, background 0.2s'
        }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
           onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
           title="Open browser print preview dialog">
          <Printer size={16} /> Browser Print
        </button>

        <button onClick={() => setShowWhatsAppModal(true)} style={{
          background: '#25D366', border: 'none', borderRadius: 6,
          padding: '9px 18px', color: '#fff', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.875rem',
          boxShadow: '0 4px 12px rgba(37,211,102,0.35)',
          transition: 'transform 0.15s, background 0.2s'
        }} onMouseOver={e => e.currentTarget.style.background = '#1ebd59'}
           onMouseOut={e => e.currentTarget.style.background = '#25D366'}
           title="Send invoice to client on WhatsApp with customized file name">
          <MessageSquare size={16} /> Send on WhatsApp
        </button>
      </div>

      {/* Notice Banner for Draft Invoices */}
      {currentStatus === 'DRAFT' && (
        <div style={{
          background: 'linear-gradient(90deg, #1e3a8a, #2563eb)',
          borderBottom: '1px solid #3b82f6',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#f8fafc',
          fontSize: '0.82rem',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
              DRAFT
            </span>
            <span>This quotation is currently in <strong>DRAFT</strong> mode. Printing or sending via WhatsApp will automatically convert it into an <strong>INVOICE CREATED</strong>.</span>
          </div>
          {quotation.id && (
            <button
              type="button"
              onClick={() => {
                navigate(`/builder?edit=${quotation.id}`);
                onClose();
              }}
              style={{
                background: '#fff', color: '#1e3a8a', border: 'none', borderRadius: 4,
                padding: '4px 12px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <Pencil size={12} /> Edit Details Now
            </button>
          )}
        </div>
      )}

      {/* Notice Banner for Approved Invoices */}
      {currentStatus === 'APPROVED' && (
        <div style={{
          background: 'linear-gradient(90deg, #065f46, #047857)',
          borderBottom: '1px solid #10b981',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#f8fafc',
          fontSize: '0.82rem',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
              APPROVED
            </span>
            <span>This quotation is <strong>APPROVED</strong> by client and locked against direct edits. To make changes, use <strong>Create Revision</strong>.</span>
          </div>
          {quotation.id && (
            <button
              type="button"
              onClick={() => {
                navigate(`/builder?revise=${quotation.id}`);
                onClose();
              }}
              style={{
                background: '#fff', color: '#047857', border: 'none', borderRadius: 4,
                padding: '4px 12px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <Copy size={12} /> Create Revision Now
            </button>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{ pointerEvents: 'none' }}>
          <QuotationDocument
            quotation={currentQuotation}
            tenantName={tenantName}
            tenantLogo={tenantLogo}
            companyProfile={companyProfile}
            paymentTerms={currentPaymentTerms}
          />
        </div>
      </div>

      {/* Brand Customization Modal Overlay */}
      {showBrandEditor && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBrandEditor(false); }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              width: '100%', maxWidth: 750, maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)', overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--surface-2)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Customize Brands for this Invoice</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  These brands appear in the Material Specification table on Page 2 of this invoice.
                </div>
              </div>
              <button
                type="button"
                className="btn-icon btn-ghost"
                onClick={() => setShowBrandEditor(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              <MaterialSpecEditor
                spec={currentSpec}
                onChange={handleSpecChange}
              />
            </div>

            <div style={{
              padding: '12px 20px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--surface-2)'
            }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowBrandEditor(false)}
              >
                Done / Apply to Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Terms Customization Modal Overlay */}
      {showPaymentTermsModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPaymentTermsModal(false); }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              width: '100%', maxWidth: 640, maxHeight: '88vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Customize Payment Terms for this Invoice
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                  Set milestone percentages &amp; payment schedule for Quote #{quotation.quotationNo}
                </div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
                onClick={() => setShowPaymentTermsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Quick Milestone Presets:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PAYMENT_TERMS_PRESETS.map((preset, idx) => {
                    const isMatch = tempPaymentTerms?.trim() === preset.terms.trim();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTempPaymentTerms(preset.terms)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          borderRadius: 8,
                          border: isMatch ? '1px solid #1a56ff' : '1px solid #cbd5e1',
                          background: isMatch ? '#eff6ff' : '#f8fafc',
                          color: isMatch ? '#1a56ff' : '#334155',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s'
                        }}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    Milestone Schedule &amp; Conditions:
                  </label>
                  <button
                    type="button"
                    onClick={() => setTempPaymentTerms(companyProfile?.paymentTerms || DEFAULT_PAYMENT_TERMS)}
                    style={{
                      background: 'none', border: 'none', color: '#2563eb',
                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Reset to Profile Default
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={tempPaymentTerms}
                  onChange={(e) => setTempPaymentTerms(e.target.value)}
                  placeholder="1. 10% Advance on booking...&#10;2. 40% on 3D approval..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  Tip: These terms will appear above the payment details in the print and exported PDF.
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px 20px', borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => setShowPaymentTermsModal(false)}
                style={{
                  background: '#f1f5f9', border: '1px solid #cbd5e1',
                  borderRadius: 6, padding: '8px 16px', color: '#475569',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePaymentTerms(tempPaymentTerms)}
                style={{
                  background: '#1a56ff', border: 'none',
                  borderRadius: 6, padding: '8px 20px', color: '#fff',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(26,86,255,0.3)'
                }}
              >
                Apply &amp; Save to Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal with File Name Customization */}
      {showWhatsAppModal && (
        <WhatsAppShareModal
          quotation={currentQuotation}
          onClose={() => setShowWhatsAppModal(false)}
          onInvoiceSent={() => {
            setCurrentStatus('INVOICE CREATED');
            if (onInvoiceCreated) onInvoiceCreated();
          }}
        />
      )}
    </div>
  );
}
