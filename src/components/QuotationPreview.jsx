import React from 'react';
import { X, Printer } from 'lucide-react';
import { formatIndianCurrency, numberToWords, formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

/* ──────────────────────────────────────────────────────────────
   Generates a fully self-contained HTML string for the quotation
   This is opened in a new window and printed from there.
   ────────────────────────────────────────────────────────────── */
function buildPrintHTML(quotation, total, tenantName, tenantLogo) {
  let srNo = 1;
  let matSrNo = 1;

  const scopeRows = (quotation.rooms || []).map(room => {
    const headerRow = `
      <tr>
        <td colspan="4" style="background:#f8cbab;color:#000;font-weight:bold;text-align:center;
          padding:5px 6px;font-size:10pt;border:1px solid #000;">
          ${room.name}
        </td>
      </tr>`;
    const items = (room.items || []).map((item) => `
      <tr>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;font-size:9pt;">${srNo++}</td>
        <td style="padding:4px 6px;border:1px solid #000;font-size:9pt;">${item.particular || ''}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;font-size:9pt;">${item.size || ''}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;font-size:9pt;">
          ${item.amount ? Number(item.amount).toLocaleString('en-IN') : '—'}
        </td>
      </tr>`).join('');
    return headerRow + items;
  }).join('');

  const matRows = (quotation.materialSpec || []).map(cat => {
    const catHeader = `
      <tr>
        <td colspan="3" style="background:#e0e0e0;color:#000;font-weight:bold;text-align:center;
          padding:5px 6px;font-size:10pt;border:1px solid #000;">
          ${cat.category}
        </td>
      </tr>`;
    const items = (cat.items || []).map((item) => `
      <tr>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;font-size:9pt;">${matSrNo++}</td>
        <td style="padding:4px 6px;border:1px solid #000;font-size:9pt;">${item.material || ''}</td>
        <td style="padding:4px 6px;border:1px solid #000;font-size:9pt;">${item.brand || ''}</td>
      </tr>`).join('');
    return catHeader + items;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${tenantName || 'Quotation'} - ${quotation.clientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: Cambria, Georgia, "Times New Roman", serif; 
      font-size: 10pt; color: #000; background: #fff; 
      line-height: 1.4;
    }
    .page { 
      width: 210mm; min-height: 277mm; padding: 12mm; 
      margin: 0 auto 10mm; background: #fff;
      border: 1px solid #ccc;
    }
    @media print {
      body { margin: 0; }
      .page { margin: 0; border: none; page-break-after: always; }
      .page:last-child { page-break-after: avoid; }
      @page { size: A4; margin: 10mm; }
      ::-webkit-scrollbar { display: none; }
    }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th { 
      padding: 5px 6px; border: 1px solid #000; font-size: 9.5pt; font-weight: bold; 
      background: #000; color: #fff; text-align: center;
    }
    
    .divider { border: none; border-top: 1px solid #666; margin: 8px 0; }
    
    .text-center { text-align: center; }
    .text-bold { font-weight: bold; }
    
    .total-box { 
      border-top: 1px solid #000; border-bottom: 1px solid #000; 
      padding: 12px 0; margin: 20px 0; text-align: center; 
    }
    .section-title { font-weight: bold; font-size: 11pt; color: #000; margin-bottom: 8px; margin-top:15px; }
    .terms-bullet { margin-left: 20px; font-size: 9.5pt; line-height: 1.6; }
    
    .header-container { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px; }
    .logo-v { font-size: 38pt; font-weight: 900; color: #002060; font-family: Arial, sans-serif; line-height: 1; }
    .header-text h1 { color: #002060; margin: 0; font-size: 22pt; font-weight: bold; letter-spacing: 0.5px; }
    .header-text p { color: #000; margin: 0; font-size: 9pt; font-style: italic; text-align: right; margin-top:2px; }
    
  </style>
</head>
<body>

<div class="page">
  <div class="header-container">
          ${tenantLogo ? `<img src="${tenantLogo}" alt="Logo" style="height: 60px; object-fit: contain;" />` : `<h2 style="margin:0; color: #1e1b4b; font-size: 28px;">${userProfile?.tenantName || 'Company'}</h2>`}
    <div class="header-text">
      <h1>${tenantName ? tenantName.toUpperCase() : "VISTARA INTERIOR'S"}</h1>
      <p>Designing Dreams Creating Reality......</p>
    </div>
  </div>
  
  <hr class="divider"/>
  
  <div class="text-center" style="font-size:9.5pt; margin-bottom:4px;">
    Office Address: Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060
  </div>
  <div class="text-center" style="font-size:9.5pt; margin-bottom:4px;">
    Contact: +91 7720097476 / 8482946451 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Email: <a href="mailto:teamvistarainteriors@gmail.com" style="color:blue;text-decoration:underline;">teamvistarainteriors@gmail.com</a>
  </div>
  <div class="text-center" style="font-size:9.5pt;">
    Date: ${formatDate(quotation.date)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Quotation No: ${quotation.quotationNo}
  </div>
  
  <hr class="divider"/>

  <div class="text-center text-bold" style="font-size:10.5pt; margin: 12px 0 6px;">
    CLIENT DETAILS
  </div>
  <div class="text-center" style="font-size:10pt; line-height: 1.6;">
    <div>Client Name: ${quotation.clientName || ''}</div>
    <div>Contact: ${quotation.clientContact || ''}</div>
    <div>Billing Address: ${quotation.clientAddress || ''}</div>
  </div>
  
  <hr class="divider" style="margin-top:10px; border-color:#ccc;"/>
  
  <div class="text-center text-bold" style="font-size:13pt; text-decoration: underline; margin: 15px 0;">
    ${quotation.projectTitle || 'INTERIOR DESIGN'}
  </div>

  <div class="section-title">SCOPE OF WORK</div>
  <table>
    <thead>
      <tr>
        <th style="width:50px;">SR .NO</th>
        <th>Particular</th>
        <th style="width:120px;">Size</th>
        <th style="width:100px;">Amount</th>
      </tr>
    </thead>
    <tbody>${scopeRows}</tbody>
  </table>

  <div class="total-box">
    <div class="text-bold" style="font-size:11pt; margin-bottom:6px;">
      COMPLETE INTERIOR TOTAL BUDGET – APPROX. Rs ${total.toLocaleString('en-IN')} / -
    </div>
    <div class="text-bold" style="font-size:10pt;">
      AMOUNT IN WORDS – ${numberToWords(total).replace('Rupees ', '').replace(' Rupees', '')} Only
    </div>
  </div>
</div>

<div class="page">
  <div class="section-title">2. MATERIAL SPECIFICATION</div>
  <table>
    <thead>
      <tr>
        <th style="width:50px;">SR .NO</th>
        <th style="width:200px;">MATERIAL</th>
        <th>BRAND</th>
      </tr>
    </thead>
    <tbody>${matRows}</tbody>
  </table>

  <div class="section-title">1. Design &amp; Execution:</div>
  <div class="terms-bullet">• 2D &amp; 3D Designing &amp; Visualization</div>
  <div class="terms-bullet">• Material Selection Assistance</div>
  <div class="terms-bullet">• On-site Supervision</div>
  <div class="terms-bullet">• Installation &amp; Finishing Work</div>
  <div class="terms-bullet">• Project Timeline: 60–65 Days</div>

  <div class="section-title">2. Why Choose ${tenantName || 'Us'}?</div>
  <div class="terms-bullet">• Transparent Pricing – No Hidden Charges</div>
  <div class="terms-bullet">• High-Quality Materials &amp; Craftsmanship</div>
  <div class="terms-bullet">• Personalized Design with 3D Views</div>
  <div class="terms-bullet">• 10-Year Warranty on Workmanship</div>
  <div class="terms-bullet">• Professional Team with End-to-End Support</div>
  <div class="terms-bullet">• Deep Cleaning will be provided by us</div>
  <div class="terms-bullet">• All Furniture Edge Work Will Be Done In Laminate Matching PVC Edge Binds to Ensure Smooth Edges and Seamless Finishing</div>

  <div class="section-title" style="margin-top:15px;">Terms &amp; Conditions:</div>
  <div style="margin-left:20px; font-size:9.5pt; line-height: 1.6;">
    <ol style="margin-top:0; padding-left:15px;">
      <li>Quotation subject to revision based on final 3D design.</li>
      <li>Standard wardrobe modules included; extra drawers at additional cost.</li>
      <li>Warranty will not be applicable for physical damage.</li>
    </ol>
  </div>
</div>

</body>
</html>`;
}

/* ──────────────────────────────────────────────────────────────
   QuotationPreview — In-app preview modal & triggers new window print
   ────────────────────────────────────────────────────────────── */
export default function QuotationPreview({ quotation, onClose }) {
  const { userProfile } = useAuth();
  const { tenantLogo } = useApp();
  const tenantName = userProfile?.tenantName || 'Workspace';

  const total = quotation.total ||
    (quotation.rooms || []).reduce((s, r) =>
      s + (r.items || []).reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0);

  const handlePrint = () => {
    const html = buildPrintHTML(quotation, total, tenantName, tenantLogo);
    const win = window.open('', '_blank', 'width=900,height=1000,scrollbars=yes');
    if (!win) { alert('Please allow popups for this site to print.'); return; }
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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', background: 'rgba(5, 10, 25, 0.85)',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#0d1b4b', borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
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

        <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.5px' }}>
          Quotation: {quotation.clientName} (QT-{quotation.quotationNo})
        </div>

        <button onClick={handlePrint} style={{
          background: '#1a56ff', border: 'none', borderRadius: 6,
          padding: '9px 24px', color: '#fff', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem',
          boxShadow: '0 4px 12px rgba(26,86,255,0.4)',
          transition: 'transform 0.15s, background 0.2s'
        }} onMouseOver={e => e.currentTarget.style.background = '#124ccf'}
           onMouseOut={e => e.currentTarget.style.background = '#1a56ff'}>
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{ pointerEvents: 'none' }}>
          <QuotationDocument quotation={quotation} total={total} tenantName={tenantName} tenantLogo={tenantLogo} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   QuotationDocument — HTML preview inside the modal using React
   Matches the buildPrintHTML structure exactly.
   ────────────────────────────────────────────────────────────── */
function QuotationDocument({ quotation, total, tenantName, tenantLogo }) {
  let scopeSrNo = 1;
  let matSrNo = 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PAGE 1 */}
      <Page>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, marginBottom: 10 }}>
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" style={{ height: 60, objectFit: 'contain' }} />
          ) : (
            <h2 style={{ margin: 0, color: '#1e1b4b', fontSize: 28 }}>{userProfile?.tenantName || 'Company'}</h2>
          )}
          <div>
            <h1 style={{ color: '#002060', margin: 0, fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 }}>
              {tenantName ? tenantName.toUpperCase() : "VISTARA INTERIOR'S"}
            </h1>
            <p style={{ color: '#000', margin: 0, fontSize: 9, fontStyle: 'italic', textAlign: 'right', marginTop: 2 }}>
              Designing Dreams Creating Reality......
            </p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #666', margin: '8px 0' }} />

        <div style={{ textAlign: 'center', fontSize: 9.5, marginBottom: 4 }}>
          Office Address: Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060
        </div>
        <div style={{ textAlign: 'center', fontSize: 9.5, marginBottom: 4 }}>
          Contact: +91 7720097476 / 8482946451 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Email: <span style={{ color: 'blue', textDecoration: 'underline' }}>teamvistarainteriors@gmail.com</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 9.5 }}>
          Date: {formatDate(quotation.date)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Quotation No: {quotation.quotationNo}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #666', margin: '8px 0' }} />

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 10.5, margin: '12px 0 6px' }}>
          CLIENT DETAILS
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, lineHeight: 1.6 }}>
          <div>Client Name: {quotation.clientName}</div>
          <div>Contact: {quotation.clientContact}</div>
          <div>Billing Address: {quotation.clientAddress}</div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, textDecoration: 'underline', margin: '15px 0' }}>
          {quotation.projectTitle || 'INTERIOR DESIGN'}
        </div>

        <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 8, marginTop: 15 }}>SCOPE OF WORK</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15 }}>
          <thead>
            <tr>
              <th style={{ width: 50, ...thStyle }}>SR .NO</th>
              <th style={thStyle}>Particular</th>
              <th style={{ width: 120, ...thStyle }}>Size</th>
              <th style={{ width: 100, ...thStyle }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(quotation.rooms || []).map((room, ri) => (
              <React.Fragment key={`room-${ri}`}>
                <tr>
                  <td colSpan={4} style={{ background: '#f8cbab', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '5px 6px', fontSize: 10, border: '1px solid #000' }}>
                    {room.name}
                  </td>
                </tr>
                {(room.items || []).map((item, ii) => (
                  <tr key={`item-${ri}-${ii}`}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{scopeSrNo++}</td>
                    <td style={tdStyle}>{item.particular}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.size}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.amount ? Number(item.amount).toLocaleString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px 0', margin: '20px 0', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 6 }}>
            COMPLETE INTERIOR TOTAL BUDGET – APPROX. Rs {total.toLocaleString('en-IN')} / -
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 10 }}>
            AMOUNT IN WORDS – {numberToWords(total).replace('Rupees ', '').replace(' Rupees', '')} Only
          </div>
        </div>
      </Page>

      {/* PAGE 2 */}
      <Page>
        <div style={{ fontWeight: 'bold', fontSize: 11, margin: '15px 0 8px' }}>2. MATERIAL SPECIFICATION</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15 }}>
          <thead>
            <tr>
              <th style={{ width: 50, ...thStyle }}>SR .NO</th>
              <th style={{ width: 200, ...thStyle }}>MATERIAL</th>
              <th style={thStyle}>BRAND</th>
            </tr>
          </thead>
          <tbody>
            {(quotation.materialSpec || []).map((cat, ci) => (
              <React.Fragment key={`cat-${ci}`}>
                <tr>
                  <td colSpan={3} style={{ background: '#e0e0e0', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '5px 6px', fontSize: 10, border: '1px solid #000' }}>
                    {cat.category}
                  </td>
                </tr>
                {(cat.items || []).map((item, ii) => (
                  <tr key={`mat-${ci}-${ii}`}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{matSrNo++}</td>
                    <td style={tdStyle}>{item.material}</td>
                    <td style={tdStyle}>{item.brand}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div style={{ fontWeight: 'bold', fontSize: 11, margin: '15px 0 8px' }}>1. Design &amp; Execution:</div>
        {['2D & 3D Designing & Visualization', 'Material Selection Assistance', 'On-site Supervision', 'Installation & Finishing Work', 'Project Timeline: 60–65 Days'].map((t, i) => (
          <div key={`s1-${i}`} style={{ marginLeft: 20, fontSize: 9.5, lineHeight: 1.6 }}>• {t}</div>
        ))}

        <div style={{ fontWeight: 'bold', fontSize: 11, margin: '15px 0 8px' }}>2. Why Choose Vistara Interiors?</div>
        {['Transparent Pricing – No Hidden Charges', 'High-Quality Materials & Craftsmanship', 'Personalized Design with 3D Views', '10-Year Warranty on Workmanship', 'Professional Team with End-to-End Support', 'Deep Cleaning will be provided by us', 'All Furniture Edge Work Will Be Done In Laminate Matching PVC Edge Binds to Ensure Smooth Edges and Seamless Finishing'].map((t, i) => (
          <div key={`s2-${i}`} style={{ marginLeft: 20, fontSize: 9.5, lineHeight: 1.6 }}>• {t}</div>
        ))}

        <div style={{ fontWeight: 'bold', fontSize: 11, margin: '15px 0 8px' }}>Terms &amp; Conditions:</div>
        <ol style={{ margin: '0 0 0 20px', paddingLeft: 15, fontSize: 9.5, lineHeight: 1.6 }}>
          <li>Quotation subject to revision based on final 3D design.</li>
          <li>Standard wardrobe modules included; extra drawers at additional cost.</li>
          <li>Warranty will not be applicable for physical damage.</li>
        </ol>
      </Page>
    </div>
  );
}

function Page({ children }) {
  return (
    <div style={{
      width: '210mm', minHeight: '277mm', background: '#fff', padding: '12mm',
      border: '1px solid #ccc', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      fontFamily: 'Cambria, Georgia, "Times New Roman", serif', fontSize: '10pt', color: '#000', lineHeight: 1.4
    }}>
      {children}
    </div>
  );
}

// Helper cell styles for React HTML equivalent
const thStyle = {
  padding: '5px 6px', border: '1px solid #000', fontSize: '9.5pt',
  fontWeight: 'bold', background: '#000', color: '#fff', textAlign: 'center'
};
const tdStyle = {
  padding: '4px 6px', border: '1px solid #000', fontSize: '9pt'
};
