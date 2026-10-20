import React from 'react';
import { formatDate, numberToWords, cleanCustomerProjectTitle } from '../utils/helpers';
import {
  SCOPE_OF_WORK_ITEMS, WHY_CHOOSE_ITEMS, TERMS_CONDITIONS,
  resolveBrand, resolvePaymentTerms,
} from '../utils/invoiceData';
import { VISTARA_BRAND } from '../constants/defaults';

/**
 * THE quotation renderer. Used by the in-app preview (QuotationPreview)
 * and, via renderToStaticMarkup, by the browser print window
 * (src/utils/printRenderer.js). One owner of invoice presentation.
 *
 * Layout mirrors the Vistara reference document (Mr. Avinash Gawade Sir.pdf):
 *   P1  letterhead (logo + navy wordmark, right-aligned tagline), contact lines
 *       between rules, Date/Quotation-No line, navied CLIENT DETAILS, left-aligned
 *       client rows, white title band with dark-navy underlined title,
 *       banded SCOPE OF WORK table (navy header, grey room bands).
 *   P2  table continuation + bordered total block + banded MATERIAL SPECIFICATION.
 *   P3  numbered Execution bullets, Why Choose bullets (•), Terms (plain sentences).
 *   P4  centered THANK YOU! / contact / TEAM line + logo.
 * Copy (bullet lists, material spec) comes from invoiceData/defaults; the shell,
 * colors and geometry live here.
 */

const NAVY = VISTARA_BRAND.navy;        // #17365D wordmark/title/team color
const DARK_NAVY = VISTARA_BRAND.tableHeader; // #0E233D scope-table header fill
const BAND = VISTARA_BRAND.band;        // #BFBFBF section bands
const DOCUMENT_WIDTH = '210mm';
const PAGE_HEIGHT = '277mm';

const TD_STYLE = {
  padding: '5px 8px', border: '1px solid #000', fontSize: '9.5pt',
  verticalAlign: 'middle'
};

const bandTd = (colSpan) => ({
  colSpan,
  background: BAND, color: '#000', fontWeight: 'bold', textAlign: 'center',
  padding: '6px', fontSize: 10.5, border: '1px solid #000', letterSpacing: 0.5
});

export default function QuotationDocument({ quotation, tenantName, tenantLogo, companyProfile = null, paymentTerms = null }) {
  const showItemAmount = quotation.showItemAmount !== false;
  const colSpan = showItemAmount ? 4 : 3;
  const brand = resolveBrand(quotation, tenantName, tenantLogo, companyProfile);
  const total = quotation.total ||
    (quotation.rooms || []).reduce((s, r) =>
      s + (r.items || []).reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0);

  const terms = resolvePaymentTerms(quotation, companyProfile, paymentTerms);
  const hasPayBlock = brand.hasBank || brand.upi || brand.qr || brand.stamp || brand.signature || brand.bottomLogo;

  const name = cleanCustomerProjectTitle(quotation.projectTitle) || 'INTERIOR DESIGN';

  let scopeSrNo = 1;
  let matSrNo = 1;

  return (
    <div className="pq-doc" style={{
      width: DOCUMENT_WIDTH, minHeight: PAGE_HEIGHT, background: '#fff', padding: '12mm',
      border: '1px solid #ccc', margin: '0 auto', boxSizing: 'border-box',
      fontFamily: 'Cambria, Georgia, "Times New Roman", serif', fontSize: '10pt', color: '#000', lineHeight: 1.4,
      display: 'flex', flexDirection: 'column', gap: '20px'
    }}>
      {/* ─── Letterhead: logo left, wordmark right of it, tagline under the wordmark ─── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {brand.logo && (
            <img
              src={brand.logo} alt="Company Logo"
              style={{ height: 75, width: 92, objectFit: 'contain', flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{
              color: NAVY, fontWeight: 'bold', fontSize: 36, lineHeight: 1.15,
              fontFamily: 'Cambria, Georgia, serif', whiteSpace: 'nowrap'
            }}>
              {brand.name.replace(/^team\s+/i, '').toUpperCase()}
            </div>
            {brand.tagline && (
              <div style={{ color: '#000', fontSize: 9.5, textAlign: 'center', marginBottom: 0, marginTop: 4 }}>
                {brand.tagline}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #000', margin: '10px 0 8px' }} />
        <div style={{ fontSize: 10, padding: '4px 0 4px 18px' }}>
          Office Address: {brand.address}
        </div>
        <div style={{ fontSize: 10, padding: '4px 0 4px 18px' }}>
          Contact: {brand.phone}
          <span style={{ display: 'inline-block', width: 70 }} />
          Email: <span style={{ color: 'blue', textDecoration: 'underline' }}>{brand.email}</span>
          {brand.gst && (<span> &nbsp;&nbsp; <strong>GST: {brand.gst}</strong></span>)}
        </div>
        <div style={{ fontSize: 10.5, padding: '4px 0 4px 18px' }}>
          Date: {formatDate(quotation.date)}
          <span style={{ display: 'inline-block', width: 110 }} />
          Quotation No: {quotation.quotationNo}
        </div>
        <div style={{ borderTop: '1px solid #000', margin: '8px 0 0' }} />
      </div>

      {/* ─── Client block ─── */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 11, margin: '4px 0 2px' }}>
        CLIENT DETAILS
      </div>
      <div style={{ fontSize: 10, padding: '4px 0 4px 18px', lineHeight: 1.85 }}>
        <div>Client Name: {quotation.clientName}</div>
        <div>Contact: {quotation.clientContact}</div>
        <div>Billing Address: {quotation.clientAddress}</div>
      </div>

      {/* ─── Title band: white strip, dark-navy bold underlined centered title ─── */}
      <div style={{
        border: '1px solid #000', padding: '8px 0', textAlign: 'center', margin: '2px 0'
      }}>
        <span style={{
          color: NAVY, fontWeight: 'bold', fontSize: 18, textDecoration: 'underline',
          letterSpacing: 0.5, fontFamily: 'Cambria, Georgia, serif'
        }}>
          {name}
        </span>
      </div>

      {/* ─── Scope of work ─── */}
      <div>
        <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#000', marginBottom: 6 }}>SCOPE OF WORK:</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 50, ...TH_STYLE_DARK }}>SR .NO</th>
              <th style={TH_STYLE_DARK}>Particular</th>
              <th style={{ width: showItemAmount ? 120 : 150, ...TH_STYLE_DARK }}>Size</th>
              {showItemAmount && <th style={{ width: 130, ...TH_STYLE_DARK }}>Amount</th>}
            </tr>
          </thead>
          <tbody>
            {(quotation.rooms || []).map((room, ri) => (
              <React.Fragment key={`room-${ri}`}>
                <tr>
                  <td {...bandTd(colSpan)}>{room.name}</td>
                </tr>
                {(room.items || []).map((item, ii) => (
                  <tr key={`item-${ri}-${ii}`}>
                    <td style={{ ...TD_STYLE, textAlign: 'center' }}>{scopeSrNo++}</td>
                    <td style={TD_STYLE}>{item.particular}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'center', whiteSpace: 'nowrap' }}>{item.size}</td>
                    {showItemAmount && (
                      <td style={{ ...TD_STYLE, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {item.amount ? Number(item.amount).toLocaleString('en-IN') : ''}
                      </td>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* ─── Total: bordered two-line block ─── */}
        <div style={{ border: '1px solid #000', padding: '10px 0', margin: '34px 0 4px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 12 }}>
            COMPLETE INTERIOR TOTAL BUDGET – APPROX. {formatINR(total)}/
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 11 }}>
            AMOUNT IN WORDS -{totalInWords(total)} Only
          </div>
        </div>
      </div>

      {/* ─── Material specification ─── */}
      <div>
        <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#000', margin: '26px 0 6px' }}>MATERIAL SPECIFICATION:</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 50, ...TH_STYLE_BLACK }}>SR .NO</th>
              <th style={{ width: 200, ...TH_STYLE_BLACK }}>MATERIAL</th>
              <th style={TH_STYLE_BLACK}>BRAND</th>
            </tr>
          </thead>
          <tbody>
            {(quotation.materialSpec || []).map((cat, ci) => (
              <React.Fragment key={`cat-${ci}`}>
                <tr>
                  <td {...bandTd(3)}>{cat.category}</td>
                </tr>
                {(cat.items || []).map((item, ii) => (
                  <tr key={`mat-${ci}-${ii}`}>
                    <td style={{ ...TD_STYLE, textAlign: 'center' }}>{matSrNo++}</td>
                    <td style={TD_STYLE}>{item.material}</td>
                    <td style={{ ...TD_STYLE, textAlign: 'center', whiteSpace: 'pre-line' }}>{item.brand}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Execution, why-us, terms ─── */}
      <div style={{ marginTop: 30 }}>
        <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 10 }}>1. Execution:</div>
        {SCOPE_OF_WORK_ITEMS.map((t, i) => (
          <div key={`s1-${i}`} style={{ fontSize: 10.5, lineHeight: 2 }}>• {t}</div>
        ))}

        <div style={{ fontWeight: 'bold', fontSize: 13, margin: '26px 0 10px' }}>2. Why Choose {brandName(brand.name)}?</div>
        {WHY_CHOOSE_ITEMS.map((t, i) => (
          <div key={`s2-${i}`} style={{ fontSize: 10.5, lineHeight: 2 }}>• {t}</div>
        ))}

        <div style={{ fontWeight: 'bold', fontSize: 13, margin: '26px 0 10px' }}>Terms &amp; Conditions:</div>
        <div style={{ fontSize: 10.5, lineHeight: 2.2 }}>
          {TERMS_CONDITIONS.map((t, i) => <div key={`t-${i}`}>{t}</div>)}
        </div>
      </div>

      {/* ─── Payment schedule (optional) ─── */}
      {terms && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 'bold', fontSize: 11, color: NAVY, textTransform: 'uppercase', marginBottom: 4 }}>
            Payment Terms &amp; Schedule:
          </div>
          <div style={{ marginLeft: 14, fontSize: 9.5, lineHeight: 1.55, whiteSpace: 'pre-line' }}>
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
              <div style={{ fontWeight: 'bold', color: NAVY, marginBottom: 4, fontSize: 10 }}>PAYMENT DETAILS:</div>
              {brand.bank?.bankName && <div><strong>Bank:</strong> {brand.bank.bankName} {brand.bank.branchName ? `(${brand.bank.branchName})` : ''}</div>}
              {brand.bank?.accountHolderName && <div><strong>A/C Name:</strong> {brand.bank.accountHolderName}</div>}
              {brand.bank?.accountNumber && <div><strong>A/C No:</strong> {brand.bank.accountNumber}</div>}
              {brand.bank?.ifscCode && <div><strong>IFSC:</strong> {brand.bank.ifscCode}</div>}
              {brand.upi && <div style={{ marginTop: 4 }}><strong>UPI ID:</strong> {brand.upi}</div>}
            </div>
          )}

          {brand.qr && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: NAVY, marginBottom: 4, fontSize: '8.5pt' }}>SCAN TO PAY</div>
              <img src={brand.qr} alt="UPI QR" style={{ width: 80, height: 80, objectFit: 'contain', border: '1px solid #ddd', padding: 2, background: '#fff' }} />
            </div>
          )}

          {(brand.stamp || brand.signature) && (
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 4 }}>
                {brand.stamp && <img src={brand.stamp} alt="Stamp" style={{ height: 55, objectFit: 'contain' }} />}
                {brand.signature && <img src={brand.signature} alt="Signature" style={{ height: 45, objectFit: 'contain' }} />}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '8.5pt', color: '#333', borderTop: '1px solid #999', paddingTop: 2 }}>Authorized Signatory</div>
            </div>
          )}
        </div>
      )}

      {/* ─── Thank-you footer: centered black THANK YOU!, contact line, navy TEAM line, logo ─── */}
      <div style={{ marginTop: 'auto', paddingTop: 48, textAlign: 'center', paddingBottom: 8 }}>
        <div style={{ fontSize: 12, marginBottom: 8 }}>THANK YOU!</div>
        <div style={{ fontSize: 12, marginBottom: 10 }}>For any queries, feel free to contact us.</div>
        <div style={{ color: '#0F243E', fontSize: 12, marginBottom: 12 }}>TEAM {brandName(brand.name)}</div>
        {brand.bottomLogo && (
          <img src={brand.bottomLogo} alt="Company Logo" style={{ height: 62, objectFit: 'contain' }} />
        )}
      </div>
    </div>
  );
}

/* ─── Shared header styles ─── */
const TH_STYLE_DARK = {
  padding: '10px 8px', border: '1px solid #000', fontSize: '11pt',
  fontWeight: 'bold', background: DARK_NAVY, color: '#fff', textAlign: 'center',
  verticalAlign: 'middle', letterSpacing: 0.5
};
const TH_STYLE_BLACK = {
  padding: '10px 8px', border: '1px solid #000', fontSize: '11pt',
  fontWeight: 'bold', background: '#000', color: '#fff', textAlign: 'center',
  verticalAlign: 'middle', letterSpacing: 0.5
};

function formatINR(n) {
  return '₹ ' + Number(n || 0).toLocaleString('en-IN');
}

function totalInWords(n) {
  return (numberToWords(Number(n || 0)) || '')
    .replace(/^Rupees\s*/i, '')
    .replace(/\s*Rupees\s*$/i, '');
}

function brandName(n) {
  return String(n || 'Our Studio').replace(/^team\s+/i, '').replace(/interior'?s/i, 'Interiors').replace(/\s+/g, ' ').trim().toUpperCase();
}
