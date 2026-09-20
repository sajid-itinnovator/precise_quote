import React from 'react';
import { Eye, FileCheck, Save, Copy, Lock } from 'lucide-react';
import { formatIndianCurrency, numberToWords } from '../../utils/helpers';

// ─── Builder Right (Summary Panel) ───────────────────────────────────────
export default function BuilderRight({
  subtotal, gst, total, totalItems, totalSqft = 0,
  includeGST, setIncludeGST, showItemAmount, setShowItemAmount,
  onSaveInvoice, onSaveDraft, onPreview,
  saved, savedMessage, clientId, isEditing, isRevising, existingQuote, saving
}) {
  return (
    <div>
      {/* Summary */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 10 }}>
          <div className="section-title">Summary</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {totalSqft > 0 && (
              <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
                {totalSqft.toLocaleString('en-IN')} SQFT
              </span>
            )}
            <span className="badge badge-info">{totalItems} Items</span>
          </div>
        </div>
        <div className="summary-panel-light">
          {/* Total SQFT Card for Interior Designers */}
          <div style={{
            background: 'var(--surface-2, #f8fafc)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 14,
            border: '1px solid var(--border-light, #e2e8f0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  📐 Total Interior Area
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Designer metric (hidden in invoice)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>
                  {totalSqft.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SQFT</span>
                </div>
                {totalSqft > 0 && subtotal > 0 ? (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    avg ₹{Math.round(subtotal / totalSqft).toLocaleString('en-IN')}/sqft
                  </div>
                ) : (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    from Sq Ft items
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{formatIndianCurrency(subtotal)}</span>
          </div>
          <div className="summary-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>GST (18%)</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={includeGST} onChange={e => setIncludeGST(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Include</span>
              </label>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{formatIndianCurrency(gst)}</span>
          </div>

          {/* Option to show or hide item-level amounts */}
          <div className="summary-row" style={{ alignItems: 'center', padding: '6px 0', borderTop: '1px dashed var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem' }}>Item Amounts</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showItemAmount}
                  onChange={e => setShowItemAmount(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {showItemAmount ? 'Show in PDF' : 'Hide in PDF'}
                </span>
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: showItemAmount ? 'var(--primary)' : 'var(--text-muted)' }}>
              {showItemAmount ? 'Detailed' : 'Lump Sum'}
            </span>
          </div>
          <hr className="summary-divider" />
          
          <div className="summary-total-box">
            <div className="summary-total-label">Final Total Amount</div>
            <div className="summary-total-value">₹{formatIndianCurrency(total)}</div>
            {total > 0 && (
              <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {numberToWords(total)} Only
              </div>
            )}
          </div>

          {/* Action Button Hierarchy inside Summary Card */}
          {isEditing && existingQuote?.status === 'APPROVED' ? (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: 8,
              padding: '12px 14px',
              marginTop: 14,
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Lock size={15} /> Invoice Approved &amp; Locked
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7f1d1d', marginTop: 4, marginBottom: 8 }}>
                Direct edits are disabled for approved invoices.
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm w-full"
                onClick={() => window.location.href = `#/builder?revise=${existingQuote.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem' }}
              >
                <Copy size={13} /> Create Revision Instead
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {/* Primary CTA */}
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={onSaveInvoice}
                disabled={!clientId || saving}
                style={{
                  padding: '11px 16px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 6px rgba(26, 86, 255, 0.25)'
                }}
              >
                <FileCheck size={17} />
                {saved && savedMessage && savedMessage.includes('Invoice')
                  ? savedMessage
                  : isEditing
                    ? (existingQuote?.status === 'DRAFT' ? 'Finalize & Save as Invoice' : 'Update & Finalize Invoice')
                    : isRevising
                      ? 'Save Revision as Invoice'
                      : 'Save as Invoice (Invoice Created)'}
              </button>

              {/* Secondary CTA */}
              <button
                type="button"
                className="btn btn-secondary w-full"
                style={{
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  background: 'var(--surface)',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 14px'
                }}
                onClick={onPreview}
              >
                <Eye size={16} /> Preview &amp; Print Quotation
              </button>

              {/* Tertiary CTA */}
              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={onSaveDraft}
                disabled={!clientId || saving}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem'
                }}
              >
                <Save size={14} />
                {saved && savedMessage && savedMessage.includes('Draft')
                  ? savedMessage
                  : isEditing
                    ? (existingQuote?.status === 'DRAFT' ? 'Save Changes to Draft' : 'Save Changes as Draft')
                    : 'Save as Draft'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
        <strong>NOTE:</strong> Prices are subject to final material verification. This quotation is valid for 15 days from the date of generation. Final measurements will be conducted on-site by our specialist.
      </div>
    </div>
  );
}
