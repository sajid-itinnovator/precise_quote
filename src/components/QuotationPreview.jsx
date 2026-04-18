import React from 'react';
import { X, Printer } from 'lucide-react';
import { formatIndianCurrency, numberToWords, formatDate } from '../utils/helpers';

/* ──────────────────────────────────────────────────────────────
   Generates a fully self-contained HTML string for the quotation
   This is opened in a new window and printed from there.
   ────────────────────────────────────────────────────────────── */
function buildPrintHTML(quotation, total) {
  let srNo = 1;
  let matSrNo = 1;

  const scopeRows = (quotation.rooms || []).map(room => {
    const headerRow = `
      <tr>
        <td colspan="4" style="background:#b4783c;color:#fff;font-weight:700;text-align:center;
          padding:5px 6px;font-size:9.5pt;border:0.3mm solid #999;">
          ${room.name}
        </td>
      </tr>`;
    const items = (room.items || []).map((item, ii) => `
      <tr style="background:${ii % 2 === 0 ? '#f5f7fc' : '#fff'}">
        <td style="padding:3px 6px;border:0.3mm solid #ccc;text-align:center;font-size:8.5pt;">${srNo++}</td>
        <td style="padding:3px 6px;border:0.3mm solid #ccc;font-size:8.5pt;">${item.particular || ''}</td>
        <td style="padding:3px 6px;border:0.3mm solid #ccc;text-align:center;font-size:8.5pt;">${item.size || ''}</td>
        <td style="padding:3px 6px;border:0.3mm solid #ccc;text-align:right;font-size:8.5pt;">
          ${item.amount ? Number(item.amount).toLocaleString('en-IN') : '—'}
        </td>
      </tr>`).join('');
    return headerRow + items;
  }).join('');

  const matRows = (quotation.materialSpec || []).map(cat => {
    const catHeader = `
      <tr>
        <td colspan="3" style="background:#b4783c;color:#fff;font-weight:700;text-align:center;
          padding:5px 6px;font-size:9.5pt;border:0.3mm solid #999;">
          ${cat.category}
        </td>
      </tr>`;
    const items = (cat.items || []).map((item, ii) => `
      <tr style="background:${ii % 2 === 0 ? '#f5f7fc' : '#fff'}">
        <td style="padding:3px 6px;border:0.3mm solid #ccc;text-align:center;font-size:8.5pt;">${matSrNo++}</td>
        <td style="padding:3px 6px;border:0.3mm solid #ccc;font-size:8.5pt;">${item.material || ''}</td>
        <td style="padding:3px 6px;border:0.3mm solid #ccc;font-size:8.5pt;">${item.brand || ''}</td>
      </tr>`).join('');
    return catHeader + items;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Vistara Quotation — ${quotation.clientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #fff; }
    .page { width: 210mm; min-height: 277mm; padding: 10mm; border: 0.5mm solid #0d1b4b; margin: 0 auto 10mm; }
    @media print {
      body { margin: 0; }
      .page { border: 0.5mm solid #0d1b4b; margin: 0; page-break-after: always; }
      .page:last-child { page-break-after: avoid; }
      @page { size: A4; margin: 8mm; }
    }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 4px 6px; border: 0.3mm solid #4a6fa5; font-size: 9pt; font-weight: 700; background: #0d1b4b; color: #fff; }
    .logo-box { background: #0d1b4b; width: 52px; height: 44px; display: inline-flex; flex-direction: column;
      align-items: center; justify-content: center; border-radius: 2px; vertical-align: middle; }
    .logo-box .v { color: #fff; font-weight: 900; font-size: 22pt; line-height: 1; }
    .logo-box .vt { color: #fff; font-size: 6pt; letter-spacing: 1px; }
    .divider { border: none; border-top: 0.5mm solid #0d1b4b; margin: 4px 0; }
    .divider-light { border: none; border-top: 0.3mm solid #ccc; margin: 4px 0; }
    .total-box { background: #f0f0f0; border-radius: 3px; padding: 5px 10px; margin-top: 6px;
      border: 0.3mm solid #ddd; }
    .section-title { font-weight: 700; font-size: 11pt; color: #0d1b4b; margin-bottom: 6px; }
    .terms-bullet { margin-left: 8px; font-size: 9.5pt; line-height: 1.7; }
    .thank-you { text-align: center; margin-top: 24px; }
  </style>
</head>
<body>

<!-- ═══ PAGE 1: Header + Client + Scope ═══ -->
<div class="page">

  <!-- Header -->
  <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:6px;">
    <div class="logo-box">
      <span class="v">V</span>
      <span class="vt">VISTARA</span>
    </div>
    <div style="flex:1;">
      <div style="color:#0d1b4b;font-weight:900;font-size:18pt;letter-spacing:0.5px;line-height:1.2;">
        VISTARA INTERIOR'S
      </div>
      <div style="color:#555;font-size:9pt;font-style:italic;">
        Designing Dreams Creating Reality......
      </div>
    </div>
  </div>
  <hr class="divider"/>
  <div style="font-size:8.5pt;margin-bottom:2px;">
    <strong>Office Address:</strong> Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060
  </div>
  <div style="display:flex;justify-content:space-between;font-size:8.5pt;">
    <span><strong>Contact:</strong> +91 7720097476 / 8482946451</span>
    <span style="color:#1a56ff;"><strong>Email:</strong> teamvistarainteriors@gmail.com</span>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:8.5pt;margin-top:2px;">
    <span><strong>Date:</strong> ${formatDate(quotation.date)}</span>
    <span><strong>Quotation No:</strong> ${quotation.quotationNo}</span>
  </div>
  <hr class="divider"/>

  <!-- Client Details -->
  <div style="text-align:center;font-weight:700;font-size:10.5pt;color:#0d1b4b;margin:8px 0 4px;">
    CLIENT DETAILS
  </div>
  <div style="font-size:9pt;line-height:1.8;">
    <div><strong>Client Name:</strong> ${quotation.clientName || ''}</div>
    <div><strong>Contact:</strong> ${quotation.clientContact || ''}</div>
    <div><strong>Billing Address:</strong> ${quotation.clientAddress || ''}</div>
  </div>
  <hr class="divider-light"/>
  <div style="text-align:center;font-weight:900;font-size:13pt;color:#0d1b4b;letter-spacing:0.5px;margin:6px 0 10px;">
    ${quotation.projectTitle || 'INTERIOR DESIGN'}
  </div>

  <!-- Scope of Work -->
  <div class="section-title">SCOPE OF WORK</div>
  <table>
    <thead>
      <tr>
        <th style="width:28px;text-align:center;">SR.NO</th>
        <th style="text-align:left;">Particular</th>
        <th style="width:62px;text-align:center;">Size</th>
        <th style="width:54px;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${scopeRows}</tbody>
  </table>

  <!-- Total -->
  <div class="total-box">
    <div style="font-weight:700;font-size:10pt;color:#0d1b4b;">
      COMPLETE INTERIOR TOTAL BUDGET – APPROX. ₹${total.toLocaleString('en-IN')}/-
    </div>
    <div style="font-weight:600;font-size:9pt;color:#333;margin-top:2px;">
      AMOUNT IN WORDS: ${numberToWords(total)} Only
    </div>
  </div>
</div>

<!-- ═══ PAGE 2: Material Specification ═══ -->
<div class="page">
  <div class="section-title" style="font-size:13pt;margin-bottom:8px;">MATERIAL SPECIFICATION</div>
  <table>
    <thead>
      <tr>
        <th style="width:28px;text-align:center;">SR.NO</th>
        <th style="width:90px;text-align:left;">Material</th>
        <th style="text-align:left;">Brand / Specification</th>
      </tr>
    </thead>
    <tbody>${matRows}</tbody>
  </table>
</div>

<!-- ═══ PAGE 3: Services & Terms ═══ -->
<div class="page">
  <div class="section-title">1. Design &amp; Execution:</div>
  <div class="terms-bullet">• 2D &amp; 3D Designing &amp; Visualization</div>
  <div class="terms-bullet">• Material Selection Assistance</div>
  <div class="terms-bullet">• On-site Supervision</div>
  <div class="terms-bullet">• Installation &amp; Finishing Work</div>
  <div class="terms-bullet">• Project Timeline: 60–65 Days</div>

  <div class="section-title" style="margin-top:14px;">2. Why Choose Vistara Interiors?</div>
  <div class="terms-bullet">• Transparent Pricing – No Hidden Charges</div>
  <div class="terms-bullet">• High-Quality Materials &amp; Craftsmanship</div>
  <div class="terms-bullet">• Personalized Design with 3D Views</div>
  <div class="terms-bullet">• 10-Year Warranty on Workmanship</div>
  <div class="terms-bullet">• Professional Team with End-to-End Support</div>
  <div class="terms-bullet">• Deep Cleaning will be provided by us</div>
  <div class="terms-bullet">• All Furniture Edge Work Will Be Done In Laminate Matching PVC Edge Binds to Ensure Smooth Edges and Seamless Finishing</div>

  <div class="section-title" style="margin-top:14px;">Terms &amp; Conditions:</div>
  <div class="terms-bullet">1. Quotation subject to revision based on final 3D design.</div>
  <div class="terms-bullet">2. Standard wardrobe modules included; extra drawers at additional cost.</div>
  <div class="terms-bullet">3. Warranty will not be applicable for physical damage.</div>

  <div class="thank-you">
    <div style="font-weight:700;font-size:14pt;color:#1a56ff;font-style:italic;">THANK YOU!</div>
    <div style="font-size:9pt;color:#555;margin-top:4px;">For any queries, feel free to contact us.</div>
    <div style="font-weight:700;font-size:10.5pt;color:#0d1b4b;margin-top:6px;">TEAM VISTARA INTERIORS</div>
    <div style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;
      background:#0d1b4b;width:48px;height:38px;border-radius:3px;margin-top:12px;vertical-align:top;">
      <span style="color:#fff;font-weight:900;font-size:18pt;line-height:1;">V</span>
      <span style="color:#fff;font-size:5pt;letter-spacing:1px;">VISTARA</span>
    </div>
  </div>
</div>

</body>
</html>`;
}

/* ──────────────────────────────────────────────────────────────
   QuotationPreview — In-app preview + print via new window
   ────────────────────────────────────────────────────────────── */
export default function QuotationPreview({ quotation, onClose }) {
  const total = quotation.total ||
    (quotation.rooms || []).reduce((s, r) =>
      s + (r.items || []).reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0);

  const handlePrint = () => {
    const html = buildPrintHTML(quotation, total);
    const win = window.open('', '_blank', 'width=900,height=1000,scrollbars=yes');
    if (!win) { alert('Please allow popups for this site to print.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    // Wait for fonts/images then print
    win.onload = () => {
      setTimeout(() => {
        win.focus();
        win.print();
        // Don't auto-close — let user see the result
      }, 400);
    };
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', background: 'rgba(10,15,40,0.75)',
    }}>
      {/* ── Toolbar ── */}
      <div style={{
        background: '#0d1b4b', borderBottom: '1px solid rgba(255,255,255,0.12)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 6,
          padding: '7px 14px', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 600,
        }}>
          <X size={15} /> Close Preview
        </button>

        <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
          📄 {quotation.clientName} · QT-{quotation.quotationNo} · ₹{formatIndianCurrency(total)}
        </div>

        <button onClick={handlePrint} style={{
          background: '#1a56ff', border: 'none', borderRadius: 6,
          padding: '8px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem',
          boxShadow: '0 2px 8px rgba(26,86,255,0.4)',
        }}>
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>

      {/* ── Scrollable preview ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '28px 0', background: '#1a1f36', display: 'flex', justifyContent: 'center' }}>
        <QuotationDocument quotation={quotation} total={total} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   QuotationDocument — HTML preview inside the modal
   ────────────────────────────────────────────────────────────── */
function QuotationDocument({ quotation, total }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page 1 */}
      <Page>
        <Header quotation={quotation} />
        <ClientDetails quotation={quotation} />
        <ScopeOfWork quotation={quotation} total={total} />
      </Page>

      {/* Page 2 */}
      <Page>
        <MaterialSpec spec={quotation.materialSpec} />
      </Page>

      {/* Page 3 */}
      <Page>
        <ServicesTerms />
      </Page>
    </div>
  );
}

function Page({ children }) {
  return (
    <div style={{
      width: '210mm', background: '#fff', padding: '10mm',
      border: '0.5mm solid #0d1b4b', borderRadius: 2,
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', color: '#000',
    }}>
      {children}
    </div>
  );
}

function Header({ quotation }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
        <div style={{
          background: '#0d1b4b', width: 52, height: 44, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2,
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1 }}>V</span>
          <span style={{ color: '#fff', fontSize: 6, letterSpacing: 1 }}>VISTARA</span>
        </div>
        <div>
          <div style={{ color: '#0d1b4b', fontWeight: 900, fontSize: 18, letterSpacing: 0.5, lineHeight: 1.2 }}>
            VISTARA INTERIOR'S
          </div>
          <div style={{ color: '#555', fontSize: 9, fontStyle: 'italic' }}>
            Designing Dreams Creating Reality......
          </div>
        </div>
      </div>
      <div style={{ borderTop: '0.5mm solid #0d1b4b', paddingTop: 4 }}>
        <div style={{ fontSize: 8.5, marginBottom: 2 }}>
          <strong>Office Address:</strong> Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5 }}>
          <span><strong>Contact:</strong> +91 7720097476 / 8482946451</span>
          <span style={{ color: '#1a56ff' }}><strong>Email:</strong> teamvistarainteriors@gmail.com</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, marginTop: 2 }}>
          <span><strong>Date:</strong> {formatDate(quotation.date)}</span>
          <span><strong>Quotation No:</strong> {quotation.quotationNo}</span>
        </div>
      </div>
      <div style={{ borderTop: '0.5mm solid #0d1b4b', marginTop: 4 }} />
    </div>
  );
}

function ClientDetails({ quotation }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 10.5, color: '#0d1b4b', margin: '8px 0 4px' }}>
        CLIENT DETAILS
      </div>
      <div style={{ fontSize: 9, lineHeight: 1.8 }}>
        <div><strong>Client Name:</strong> {quotation.clientName}</div>
        <div><strong>Contact:</strong> {quotation.clientContact}</div>
        <div><strong>Billing Address:</strong> {quotation.clientAddress}</div>
      </div>
      <div style={{ borderTop: '0.3mm solid #ccc', margin: '4px 0' }} />
      <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 13, color: '#0d1b4b', letterSpacing: 0.5, margin: '6px 0 10px' }}>
        {quotation.projectTitle || 'INTERIOR DESIGN'}
      </div>
    </div>
  );
}

function ScopeOfWork({ quotation, total }) {
  let srNo = 1;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 10.5, color: '#0d1b4b', marginBottom: 4 }}>SCOPE OF WORK</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#0d1b4b', color: '#fff' }}>
            <th style={th({ width: 28 })}>SR.NO</th>
            <th style={th({ textAlign: 'left' })}>Particular</th>
            <th style={th({ width: 62 })}>Size</th>
            <th style={th({ width: 54, textAlign: 'right' })}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(quotation.rooms || []).map((room, ri) => (
            <React.Fragment key={ri}>
              <tr>
                <td colSpan={4} style={{ background: '#b4783c', color: '#fff', fontWeight: 700, textAlign: 'center', padding: '5px 6px', fontSize: 9.5, border: '0.3mm solid #999' }}>
                  {room.name}
                </td>
              </tr>
              {(room.items || []).map((item, ii) => (
                <tr key={ii} style={{ background: ii % 2 === 0 ? '#f5f7fc' : '#fff' }}>
                  <td style={td({ textAlign: 'center' })}>{srNo++}</td>
                  <td style={td({ textAlign: 'left' })}>{item.particular}</td>
                  <td style={td({ textAlign: 'center' })}>{item.size}</td>
                  <td style={td({ textAlign: 'right' })}>{item.amount ? Number(item.amount).toLocaleString('en-IN') : '—'}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div style={{ background: '#f0f0f0', borderRadius: 3, padding: '5px 10px', marginTop: 6, border: '0.3mm solid #ddd' }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: '#0d1b4b' }}>
          COMPLETE INTERIOR TOTAL BUDGET – APPROX. ₹{total.toLocaleString('en-IN')}/-
        </div>
        <div style={{ fontWeight: 600, fontSize: 9, color: '#333', marginTop: 2 }}>
          AMOUNT IN WORDS: {numberToWords(total)} Only
        </div>
      </div>
    </div>
  );
}

function MaterialSpec({ spec }) {
  let srNo = 1;
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#0d1b4b', marginBottom: 8 }}>MATERIAL SPECIFICATION</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#0d1b4b', color: '#fff' }}>
            <th style={th({ width: 28 })}>SR.NO</th>
            <th style={th({ width: 90, textAlign: 'left' })}>Material</th>
            <th style={th({ textAlign: 'left' })}>Brand / Specification</th>
          </tr>
        </thead>
        <tbody>
          {(spec || []).map((cat, ci) => (
            <React.Fragment key={ci}>
              <tr>
                <td colSpan={3} style={{ background: '#b4783c', color: '#fff', fontWeight: 700, textAlign: 'center', padding: '5px 6px', fontSize: 9.5, border: '0.3mm solid #999' }}>
                  {cat.category}
                </td>
              </tr>
              {(cat.items || []).map((item, ii) => (
                <tr key={ii} style={{ background: ii % 2 === 0 ? '#f5f7fc' : '#fff' }}>
                  <td style={td({ textAlign: 'center' })}>{srNo++}</td>
                  <td style={td({ textAlign: 'left' })}>{item.material}</td>
                  <td style={td({ textAlign: 'left' })}>{item.brand}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServicesTerms() {
  return (
    <div style={{ fontSize: 9.5, lineHeight: 1.7 }}>
      <div style={{ fontWeight: 700, fontSize: 11, color: '#0d1b4b', marginBottom: 4 }}>1. Design &amp; Execution:</div>
      {['2D & 3D Designing & Visualization', 'Material Selection Assistance', 'On-site Supervision', 'Installation & Finishing Work', 'Project Timeline: 60–65 Days']
        .map((t, i) => <div key={i} style={{ marginLeft: 8 }}>• {t}</div>)}

      <div style={{ fontWeight: 700, fontSize: 11, color: '#0d1b4b', margin: '14px 0 4px' }}>2. Why Choose Vistara Interiors?</div>
      {['Transparent Pricing – No Hidden Charges', 'High-Quality Materials & Craftsmanship', 'Personalized Design with 3D Views', '10-Year Warranty on Workmanship', 'Professional Team with End-to-End Support', 'Deep Cleaning will be provided by us', 'All Furniture Edge Work Will Be Done In Laminate Matching PVC Edge Binds to Ensure Smooth Edges and Seamless Finishing']
        .map((t, i) => <div key={i} style={{ marginLeft: 8 }}>• {t}</div>)}

      <div style={{ fontWeight: 700, fontSize: 11, color: '#0d1b4b', margin: '14px 0 4px' }}>Terms &amp; Conditions:</div>
      {['Quotation subject to revision based on final 3D design.', 'Standard wardrobe modules included; extra drawers at additional cost.', 'Warranty will not be applicable for physical damage.']
        .map((t, i) => <div key={i} style={{ marginLeft: 8 }}>{i + 1}. {t}</div>)}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a56ff', fontStyle: 'italic' }}>THANK YOU!</div>
        <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>For any queries, feel free to contact us.</div>
        <div style={{ fontWeight: 700, fontSize: 10.5, color: '#0d1b4b', marginTop: 6 }}>TEAM VISTARA INTERIORS</div>
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#0d1b4b', width: 48, height: 38, borderRadius: 3, marginTop: 10,
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>V</span>
          <span style={{ color: '#fff', fontSize: 6, letterSpacing: 1 }}>VISTARA</span>
        </div>
      </div>
    </div>
  );
}

// Helper cell styles
const th = (extra = {}) => ({
  padding: '4px 6px', border: '0.3mm solid #4a6fa5',
  textAlign: 'center', fontWeight: 700, fontSize: 9, ...extra,
});
const td = (extra = {}) => ({
  padding: '3px 6px', border: '0.3mm solid #ccc',
  fontSize: 8.5, verticalAlign: 'middle', ...extra,
});
