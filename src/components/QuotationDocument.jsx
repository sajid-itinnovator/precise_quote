import React from 'react';
import { formatDate, numberToWords, cleanCustomerProjectTitle } from '../utils/helpers';
import {
  SCOPE_OF_WORK_ITEMS, WHY_CHOOSE_ITEMS, TERMS_CONDITIONS,
  resolveBrand, resolvePaymentTerms,
} from '../utils/invoiceData';

/**
 * THE quotation renderer. Used by the in-app preview (QuotationPreview)
 * and, via renderToStaticMarkup, by the browser print window
 * (src/utils/printRenderer.js). One owner of invoice presentation.
 */

const TH_STYLE = {
  padding: '6px 8px', border: '1px solid #000', fontSize: '10pt',
  fontWeight: 'bold', background: '#0F243E', color: '#fff', textAlign: 'center',
  verticalAlign: 'middle'
};
const TD_STYLE = {
  padding: '5px 8px', border: '1px solid #000', fontSize: '9.5pt',
  verticalAlign: 'middle'
};

export default function QuotationDocument({ quotation, tenantName, tenantLogo, companyProfile = null, paymentTerms = null }) {
  const showItemAmount = quotation.showItemAmount !== false;
  const colSpan = showItemAmount ? 4 : 3;
  const brand = resolveBrand(quotation, tenantName, tenantLogo, companyProfile);
  const total = quotation.total ||
    (quotation.rooms || []).reduce((s, r) =>
      s + (r.items || []).reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0);

  const terms = resolvePaymentTerms(quotation, companyProfile, paymentTerms);
  const hasPayBlock = brand.hasBank || brand.upi || brand.qr || brand.stamp || brand.signature || brand.bottomLogo;

  let scopeSrNo = 1;
  let matSrNo = 1;

  return (
    <div className="pq-doc" style={{
      width: '210mm', minHeight: '277mm', background: '#fff', padding: '12mm',
      border: '1px solid #ccc', margin: '0 auto', boxSizing: 'border-box',
      fontFamily: 'Cambria, Georgia, "Times New Roman", serif', fontSize: '10pt', color: '#000', lineHeight: 1.4,
      display: 'flex', flexDirection: 'column', gap: '20px'
    }}>
      {/* ─── Letterhead ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, marginBottom: 10 }}>
        {brand.logo ? (
          <img src={brand.logo} alt="Logo" style={{ height: 60, objectFit: 'contain' }} />
        ) : (
          <h2 style={{ margin: 0, color: '#17365D', fontSize: 28 }}>{brand.name}</h2>
        )}
        <div>
          <h1 style={{ color: '#17365D', margin: 0, fontSize: 26, fontWeight: 'bold', letterSpacing: 0.5, fontFamily: 'Cambria, Georgia, serif' }}>
            {brand.name.toUpperCase()}
          </h1>
          {brand.tagline && (
            <p style={{ color: '#000', margin: 0, fontSize: 9.5, fontStyle: 'italic', textAlign: 'right', marginTop: 2 }}>
              {brand.tagline}
            </p>
          )}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #666', margin: '8px 0' }} />

      <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 4 }}>
        Office Address: {brand.address}
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 4 }}>
        Contact: {brand.phone} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Email: <span style={{ color: 'blue', textDecoration: 'underline' }}>{brand.email}</span>
        {brand.gst && <span> &nbsp;|&nbsp; <strong>GST: {brand.gst}</strong></span>}
      </div>
      <div style={{ textAlign: 'center', fontSize: 10 }}>
        Date: {formatDate(quotation.date)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Quotation No: {quotation.quotationNo}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #666', margin: '8px 0' }} />

      {/* ─── Client block ─── */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 11, margin: '12px 0 6px' }}>
        CLIENT DETAILS
      </div>
      <div style={{ textAlign: 'left', fontSize: 10, lineHeight: 1.6 }}>
        <div>Client Name: {quotation.clientName}</div>
        <div>Contact: {quotation.clientContact}</div>
        <div>Billing Address: {quotation.clientAddress}</div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />

      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, textDecoration: 'underline', margin: '16px 0 14px', color: '#17365D' }}>
        {cleanCustomerProjectTitle(quotation.projectTitle) || 'INTERIOR DESIGN'}
      </div>

      {/* ─── Scope of work ─── */}
      <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', marginBottom: 8, marginTop: 18 }}>SCOPE OF WORK:</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15 }}>
        <thead>
          <tr>
            <th style={{ width: 50, ...TH_STYLE }}>SR .NO</th>
            <th style={TH_STYLE}>PARTICULAR</th>
            <th style={{ width: showItemAmount ? 120 : 150, ...TH_STYLE }}>SIZE</th>
            {showItemAmount && <th style={{ width: 100, ...TH_STYLE }}>AMOUNT</th>}
          </tr>
        </thead>
        <tbody>
          {(quotation.rooms || []).map((room, ri) => (
            <React.Fragment key={`room-${ri}`}>
              <tr>
                <td colSpan={colSpan} style={{ background: '#BFBFBF', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '6px', fontSize: 10.5, border: '1px solid #000', letterSpacing: 0.5 }}>
                  {room.name}
                </td>
              </tr>
              {(room.items || []).map((item, ii) => (
                <tr key={`item-${ri}-${ii}`}>
                  <td style={{ ...TD_STYLE, textAlign: 'center' }}>{scopeSrNo++}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'left' }}>{item.particular}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'center' }}>{item.size}</td>
                  {showItemAmount && (
                    <td style={{ ...TD_STYLE, textAlign: 'center' }}>{item.amount ? Number(item.amount).toLocaleString('en-IN') : '—'}</td>
                  )}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ─── Total ─── */}
      <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px 0', margin: '18px 0', textAlign: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: 11.5, marginBottom: 6, color: '#000' }}>
          COMPLETE INTERIOR TOTAL BUDGET – APPROX. ₹ {total.toLocaleString('en-IN')}/-
        </div>
        <div style={{ fontWeight: 'bold', fontSize: 10.5, color: '#000' }}>
          AMOUNT IN WORDS – {numberToWords(total).replace('Rupees ', '').replace(' Rupees', '')} Only
        </div>
      </div>

      {/* ─── Material specification ─── */}
      <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', margin: '20px 0 8px' }}>MATERIAL SPECIFICATION:</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15 }}>
        <thead>
          <tr>
            <th style={{ width: 50, ...TH_STYLE }}>SR .NO</th>
            <th style={{ width: 200, ...TH_STYLE }}>MATERIAL</th>
            <th style={TH_STYLE}>BRAND</th>
          </tr>
        </thead>
        <tbody>
          {(quotation.materialSpec || []).map((cat, ci) => (
            <React.Fragment key={`cat-${ci}`}>
              <tr>
                <td colSpan={3} style={{ background: '#BFBFBF', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '6px', fontSize: 10.5, border: '1px solid #000', letterSpacing: 0.5 }}>
                  {cat.category}
                </td>
              </tr>
              {(cat.items || []).map((item, ii) => (
                <tr key={`mat-${ci}-${ii}`}>
                  <td style={{ ...TD_STYLE, textAlign: 'center' }}>{matSrNo++}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'left' }}>{item.material}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'center', whiteSpace: 'pre-line' }}>{item.brand}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ─── Services, why-us, terms ─── */}
      <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', margin: '18px 0 8px' }}>1. Design &amp; Execution:</div>
      {SCOPE_OF_WORK_ITEMS.map((t, i) => (
        <div key={`s1-${i}`} style={{ marginLeft: 20, fontSize: 10, lineHeight: 1.6 }}>• {t}</div>
      ))}

      <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', margin: '18px 0 8px' }}>2. Why Choose {brand.name || 'Our Studio'}?</div>
      {WHY_CHOOSE_ITEMS.map((t, i) => (
        <div key={`s2-${i}`} style={{ marginLeft: 20, fontSize: 10, lineHeight: 1.6 }}>• {t}</div>
      ))}

      <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', margin: '18px 0 8px' }}>Terms &amp; Conditions:</div>
      <ol style={{ margin: '0 0 0 20px', paddingLeft: 15, fontSize: 10, lineHeight: 1.6 }}>
        {TERMS_CONDITIONS.map((t, i) => <li key={`t-${i}`}>{t}</li>)}
      </ol>

      {/* ─── Payment terms ─── */}
      {terms && (
        <div style={{ marginTop: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 'bold', fontSize: 11, color: '#17365D', textTransform: 'uppercase', marginBottom: 4 }}>
            Payment Terms &amp; Schedule:
          </div>
          <div style={{ marginLeft: 14, fontSize: 9.5, lineHeight: 1.55, color: '#111', whiteSpace: 'pre-line' }}>
            {terms}
          </div>
        </div>
      )}

      {/* ─── Payment details block ─── */}
      {hasPayBlock && (
        <div style={{
          marginTop: 18, padding: '12px 16px', border: '1px solid #ccc', borderRadius: 6,
          background: '#fafafa', display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', gap: 16, fontSize: 9.5
        }}>
          {(brand.hasBank || brand.upi) && (
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#17365D', marginBottom: 4, fontSize: 10 }}>PAYMENT DETAILS:</div>
              {brand.bank?.bankName && <div><strong>Bank:</strong> {brand.bank.bankName} {brand.bank.branchName ? `(${brand.bank.branchName})` : ''}</div>}
              {brand.bank?.accountHolderName && <div><strong>A/C Name:</strong> {brand.bank.accountHolderName}</div>}
              {brand.bank?.accountNumber && <div><strong>A/C No:</strong> {brand.bank.accountNumber}</div>}
              {brand.bank?.ifscCode && <div><strong>IFSC:</strong> {brand.bank.ifscCode}</div>}
              {brand.bank?.swiftCode && <div><strong>SWIFT:</strong> {brand.bank.swiftCode}</div>}
              {brand.upi && <div style={{ marginTop: 4 }}><strong>UPI ID:</strong> {brand.upi}</div>}
            </div>
          )}

          {brand.qr && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#17365D', marginBottom: 4, fontSize: '8.5pt' }}>SCAN TO PAY</div>
              <img src={brand.qr} alt="UPI QR" style={{ width: 80, height: 80, objectFit: 'contain', border: '1px solid #ddd', padding: 2, background: '#fff' }} />
            </div>
          )}

          {(brand.stamp || brand.signature || brand.bottomLogo) && (
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {brand.bottomLogo && (
                <div style={{ marginBottom: 6 }}>
                  <img src={brand.bottomLogo} alt="Logo" style={{ maxHeight: 42, maxWidth: 120, objectFit: 'contain' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 4 }}>
                {brand.stamp && <img src={brand.stamp} alt="Stamp" style={{ height: 55, objectFit: 'contain' }} />}
                {brand.signature && <img src={brand.signature} alt="Signature" style={{ height: 45, objectFit: 'contain' }} />}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '8.5pt', color: '#333', borderTop: '1px solid #999', paddingTop: 2 }}>Authorized Signatory</div>
            </div>
          )}
        </div>
      )}

      {/* ─── Sign-off ─── */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {brand.bottomLogo ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={brand.bottomLogo} alt="Company Logo" style={{ maxHeight: 44, maxWidth: 130, objectFit: 'contain' }} />
          </div>
        ) : <div />}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', fontStyle: 'italic', color: '#17365D', marginBottom: 4 }}>THANK YOU!</div>
          <div style={{ fontSize: 9.5, fontStyle: 'italic', color: '#555', marginBottom: 6 }}>For any queries, feel free to contact us.</div>
          <div style={{ fontSize: 11.5, fontWeight: 'bold', color: '#0F243E' }}>TEAM {brand.name.toUpperCase().replace(/^TEAM\s+/i, '')}</div>
        </div>
      </div>
    </div>
  );
}
