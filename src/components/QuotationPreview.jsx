import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Printer, Layers, Pencil, Copy, Lock, MessageSquare } from 'lucide-react';
import { formatIndianCurrency, numberToWords, formatDate, cleanCustomerProjectTitle } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import MaterialSpecEditor from './MaterialSpecEditor';
import WhatsAppShareModal from './WhatsAppShareModal';

/* ──────────────────────────────────────────────────────────────
   Generates a fully self-contained HTML string for the quotation
   This is opened in a new window and printed from there.
   ────────────────────────────────────────────────────────────── */
function buildPrintHTML(quotation, total, tenantName, tenantLogo, showItemAmount = true) {
  let srNo = 1;
  let matSrNo = 1;

  const colSpan = showItemAmount ? 4 : 3;

  const scopeRows = (quotation.rooms || []).map(room => {
    const headerRow = `
      <tr>
        <td colspan="${colSpan}" style="background:#BFBFBF;color:#000;font-weight:bold;text-align:center;
          padding:6px;font-size:10.5pt;border:1px solid #000;letter-spacing:0.5px;">
          ${room.name}
        </td>
      </tr>`;
    const items = (room.items || []).map((item) => `
      <tr>
        <td style="padding:5px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;">${srNo++}</td>
        <td style="padding:5px 8px;border:1px solid #000;text-align:left;font-size:9.5pt;">${item.particular || ''}</td>
        <td style="padding:5px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;">${item.size || ''}</td>
        ${showItemAmount ? `
        <td style="padding:5px 8px;border:1px solid #000;text-align:center;font-size:9.5pt;">
          ${item.amount ? Number(item.amount).toLocaleString('en-IN') : '—'}
        </td>` : ''}
      </tr>`).join('');
    return headerRow + items;
  }).join('');

  const matRows = (quotation.materialSpec || []).map(cat => {
    const catHeader = `
      <tr>
        <td colspan="3" style="background:#BFBFBF;color:#000;font-weight:bold;text-align:center;
          padding:6px;font-size:10.5pt;border:1px solid #000;letter-spacing:0.5px;">
          ${cat.category}
        </td>
      </tr>`;
    const items = (cat.items || []).map((item) => `
      <tr>
        <td style="padding:5px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;">${matSrNo++}</td>
        <td style="padding:5px 8px;border:1px solid #000;text-align:left;font-size:9.5pt;">${item.material || ''}</td>
        <td style="padding:5px 8px;border:1px solid #000;text-align:center;font-size:9.5pt;white-space:pre-line;">${(item.brand || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
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
      .page { 
        width: 100%; min-height: auto; margin: 0; padding: 0; border: none; 
        box-shadow: none;
      }
      @page { size: A4; margin: 12mm; }
      ::-webkit-scrollbar { display: none; }
      tr, .terms-bullet { page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
      .section-title { page-break-after: avoid; break-after: avoid; }
      .total-box { page-break-inside: avoid; break-inside: avoid; }
    }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th { 
      padding: 6px 8px; border: 1px solid #000; font-size: 10pt; font-weight: bold; 
      background: #0F243E; color: #fff; text-align: center; vertical-align: middle;
    }
    td { vertical-align: middle; }
    
    .divider { border: none; border-top: 1px solid #666; margin: 8px 0; }
    
    .text-center { text-align: center; }
    .text-bold { font-weight: bold; }
    
    .total-box { 
      border-top: 1px solid #000; border-bottom: 1px solid #000; 
      padding: 12px 0; margin: 18px 0; text-align: center; 
    }
    .section-title { font-weight: bold; font-size: 13.5pt; color: #222222; margin-bottom: 8px; margin-top: 18px; }
    .terms-bullet { margin-left: 20px; font-size: 10pt; line-height: 1.6; }
    
    .header-container { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px; }
    .header-text h1 { color: #17365D; margin: 0; font-size: 26pt; font-weight: bold; font-family: Cambria, Georgia, serif; letter-spacing: 0.5px; }
    .header-text p { color: #000; margin: 0; font-size: 9.5pt; font-style: italic; text-align: right; margin-top: 2px; }
    
  </style>
</head>
<body>

<div class="page">
  <div class="header-container">
    ${tenantLogo ? `<img src="${tenantLogo}" alt="Logo" style="height: 60px; object-fit: contain;" />` : `<h2 style="margin:0; color: #17365D; font-size: 28px;">${userProfile?.tenantName || 'Company'}</h2>`}
    <div class="header-text">
      <h1>${tenantName ? tenantName.toUpperCase() : "VISTARA INTERIOR'S"}</h1>
      <p>Designing Dreams Creating Reality......</p>
    </div>
  </div>
  
  <hr class="divider"/>
  
  <div class="text-center" style="font-size:10pt; margin-bottom:4px;">
    Office Address: Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060
  </div>
  <div class="text-center" style="font-size:10pt; margin-bottom:4px;">
    Contact: +91 7720097476 / 8482946451 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Email: <a href="mailto:teamvistarainteriors@gmail.com" style="color:blue;text-decoration:underline;">teamvistarainteriors@gmail.com</a>
  </div>
  <div class="text-center" style="font-size:10pt;">
    Date: ${formatDate(quotation.date)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Quotation No: ${quotation.quotationNo}
  </div>
  
  <hr class="divider"/>

  <div class="text-center text-bold" style="font-size:11pt; margin: 12px 0 6px;">
    CLIENT DETAILS
  </div>
  <div style="font-size:10pt; line-height: 1.6; text-align: left;">
    <div>Client Name: ${quotation.clientName || ''}</div>
    <div>Contact: ${quotation.clientContact || ''}</div>
    <div>Billing Address: ${quotation.clientAddress || ''}</div>
  </div>
  
  <hr class="divider" style="margin-top:10px; border-color:#ccc;"/>
  
  <div class="text-center text-bold" style="font-size:18pt; text-decoration: underline; margin: 16px 0 14px; color: #17365D;">
    ${cleanCustomerProjectTitle(quotation.projectTitle) || 'INTERIOR DESIGN'}
  </div>

  <div class="section-title">SCOPE OF WORK:</div>
  <table>
    <thead>
      <tr>
        <th style="width:50px;">SR .NO</th>
        <th>Particular</th>
        <th style="width:${showItemAmount ? '120px' : '150px'};">Size</th>
        ${showItemAmount ? `<th style="width:100px;">Amount</th>` : ''}
      </tr>
    </thead>
    <tbody>${scopeRows}</tbody>
  </table>

  <div class="total-box">
    <div class="text-bold" style="font-size:11.5pt; margin-bottom:6px; color: #000;">
      COMPLETE INTERIOR TOTAL BUDGET – APPROX. ₹ ${total.toLocaleString('en-IN')}/-
    </div>
    <div class="text-bold" style="font-size:10.5pt; color: #000;">
      AMOUNT IN WORDS – ${numberToWords(total).replace('Rupees ', '').replace(' Rupees', '')} Only
    </div>
  </div>

  <div class="section-title" style="margin-top:20px;">MATERIAL SPECIFICATION:</div>
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
  <div style="margin-left:20px; font-size:10pt; line-height: 1.6;">
    <ol style="margin-top:0; padding-left:15px;">
      <li>Quotation subject to revision based on final 3D design.</li>
      <li>Standard wardrobe modules included; extra drawers at additional cost.</li>
      <li>Warranty will not be applicable for physical damage.</li>
    </ol>
  </div>

  <div style="margin-top: 30px; text-align: right;">
    <div style="font-size: 13pt; font-weight: bold; font-style: italic; color: #17365D; margin-bottom: 4px;">THANK YOU!</div>
    <div style="font-size: 9.5pt; font-style: italic; color: #555; margin-bottom: 6px;">For any queries, feel free to contact us.</div>
    <div style="font-size: 11.5pt; font-weight: bold; color: #0F243E;">TEAM VISTARA INTERIORS</div>
  </div>
</div>

</body>
</html>`;
}

/* ──────────────────────────────────────────────────────────────
   QuotationPreview — In-app preview modal & triggers new window print
   ────────────────────────────────────────────────────────────── */
export default function QuotationPreview({ quotation, onClose, onUpdateShowItemAmount, onUpdateMaterialSpec, onInvoiceCreated }) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { tenantLogo, updateQuotation, updateProject, projects } = useApp();
  const tenantName = userProfile?.tenantName || 'Workspace';

  const [showItemAmount, setShowItemAmount] = useState(
    quotation.showItemAmount !== undefined ? quotation.showItemAmount : true
  );
  const [currentSpec, setCurrentSpec] = useState(quotation.materialSpec || []);
  const [showBrandEditor, setShowBrandEditor] = useState(false);
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

  const total = quotation.total ||
    (quotation.rooms || []).reduce((s, r) =>
      s + (r.items || []).reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0);

  const handleToggleAmount = (val) => {
    setShowItemAmount(val);
    if (onUpdateShowItemAmount) {
      onUpdateShowItemAmount(val);
    }
  };

  const handleSpecChange = (newSpec) => {
    setCurrentSpec(newSpec);
    if (onUpdateMaterialSpec) {
      onUpdateMaterialSpec(newSpec);
    }
  };

  const handlePrint = async () => {
    // Automatically transition quotation to 'INVOICE CREATED' on printing if draft
    if (currentStatus === 'DRAFT') {
      await handleStatusChange('INVOICE CREATED');
    }
    if (onInvoiceCreated) {
      onInvoiceCreated();
    }

    const qWithSpec = { ...quotation, materialSpec: currentSpec, status: currentStatus === 'DRAFT' ? 'INVOICE CREATED' : currentStatus };
    const html = buildPrintHTML(qWithSpec, total, tenantName, tenantLogo, showItemAmount);
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

  const currentQuotation = { ...quotation, materialSpec: currentSpec, status: currentStatus };

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
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Edit & Revision Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentStatus !== 'APPROVED' ? (
            <button
              type="button"
              onClick={() => {
                if (quotation.id) {
                  navigate(`/builder?edit=${quotation.id}`);
                }
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

        <button onClick={handlePrint} style={{
          background: '#1a56ff', border: 'none', borderRadius: 6,
          padding: '9px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem',
          boxShadow: '0 4px 12px rgba(26,86,255,0.4)',
          transition: 'transform 0.15s, background 0.2s'
        }} onMouseOver={e => e.currentTarget.style.background = '#124ccf'}
           onMouseOut={e => e.currentTarget.style.background = '#1a56ff'}>
          <Printer size={16} /> Print / Save PDF
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
          background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8)',
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
            <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
              DRAFT
            </span>
            <span>This is a saved <strong>Draft Quotation</strong>. You can edit items, dimensions, and rates anytime, or click <strong>Print / Save as PDF</strong> to generate the final invoice.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (quotation.id) navigate(`/builder?edit=${quotation.id}`);
              onClose();
            }}
            style={{
              background: '#fff', color: '#1e3a8a', border: 'none', borderRadius: 4,
              padding: '4px 12px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            <Pencil size={12} /> Edit Draft Now
          </button>
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
          <QuotationDocument quotation={currentQuotation} total={total} tenantName={tenantName} tenantLogo={tenantLogo} showItemAmount={showItemAmount} />
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

/* ──────────────────────────────────────────────────────────────
   QuotationDocument — HTML preview inside the modal using React
   Matches the buildPrintHTML structure exactly.
   ────────────────────────────────────────────────────────────── */
function QuotationDocument({ quotation, total, tenantName, tenantLogo, showItemAmount = true }) {
  let scopeSrNo = 1;
  let matSrNo = 1;
  const colSpan = showItemAmount ? 4 : 3;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PAGE 1 */}
      <Page>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, marginBottom: 10 }}>
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" style={{ height: 60, objectFit: 'contain' }} />
          ) : (
            <h2 style={{ margin: 0, color: '#17365D', fontSize: 28 }}>{tenantName || 'Company'}</h2>
          )}
          <div>
            <h1 style={{ color: '#17365D', margin: 0, fontSize: 26, fontWeight: 'bold', letterSpacing: 0.5, fontFamily: 'Cambria, Georgia, serif' }}>
              {tenantName ? tenantName.toUpperCase() : "VISTARA INTERIOR'S"}
            </h1>
            <p style={{ color: '#000', margin: 0, fontSize: 9.5, fontStyle: 'italic', textAlign: 'right', marginTop: 2 }}>
              Designing Dreams Creating Reality......
            </p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #666', margin: '8px 0' }} />

        <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 4 }}>
          Office Address: Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 4 }}>
          Contact: +91 7720097476 / 8482946451 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Email: <span style={{ color: 'blue', textDecoration: 'underline' }}>teamvistarainteriors@gmail.com</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10 }}>
          Date: {formatDate(quotation.date)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Quotation No: {quotation.quotationNo}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #666', margin: '8px 0' }} />

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

        <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', marginBottom: 8, marginTop: 18 }}>SCOPE OF WORK:</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15 }}>
          <thead>
            <tr>
              <th style={{ width: 50, ...thStyle }}>SR .NO</th>
              <th style={thStyle}>Particular</th>
              <th style={{ width: showItemAmount ? 120 : 150, ...thStyle }}>Size</th>
              {showItemAmount && <th style={{ width: 100, ...thStyle }}>Amount</th>}
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
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{scopeSrNo++}</td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>{item.particular}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.size}</td>
                    {showItemAmount && (
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{item.amount ? Number(item.amount).toLocaleString('en-IN') : '—'}</td>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px 0', margin: '18px 0', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: 11.5, marginBottom: 6, color: '#000' }}>
            COMPLETE INTERIOR TOTAL BUDGET – APPROX. ₹ {total.toLocaleString('en-IN')}/-
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 10.5, color: '#000' }}>
            AMOUNT IN WORDS – {numberToWords(total).replace('Rupees ', '').replace(' Rupees', '')} Only
          </div>
        </div>

        {/* MATERIAL SPECIFICATION appears immediately after total amount */}
        <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', margin: '20px 0 8px' }}>MATERIAL SPECIFICATION:</div>
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
                  <td colSpan={3} style={{ background: '#BFBFBF', color: '#000', fontWeight: 'bold', textAlign: 'center', padding: '6px', fontSize: 10.5, border: '1px solid #000', letterSpacing: 0.5 }}>
                    {cat.category}
                  </td>
                </tr>
                {(cat.items || []).map((item, ii) => (
                  <tr key={`mat-${ci}-${ii}`}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{matSrNo++}</td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>{item.material}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'pre-line' }}>{item.brand}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', margin: '18px 0 8px' }}>1. Design &amp; Execution:</div>
        {['2D & 3D Designing & Visualization', 'Material Selection Assistance', 'On-site Supervision', 'Installation & Finishing Work', 'Project Timeline: 60–65 Days'].map((t, i) => (
          <div key={`s1-${i}`} style={{ marginLeft: 20, fontSize: 10, lineHeight: 1.6 }}>• {t}</div>
        ))}

        <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', margin: '18px 0 8px' }}>2. Why Choose {tenantName || 'Vistara Interiors'}?</div>
        {['Transparent Pricing – No Hidden Charges', 'High-Quality Materials & Craftsmanship', 'Personalized Design with 3D Views', '10-Year Warranty on Workmanship', 'Professional Team with End-to-End Support', 'Deep Cleaning will be provided by us', 'All Furniture Edge Work Will Be Done In Laminate Matching PVC Edge Binds to Ensure Smooth Edges and Seamless Finishing'].map((t, i) => (
          <div key={`s2-${i}`} style={{ marginLeft: 20, fontSize: 10, lineHeight: 1.6 }}>• {t}</div>
        ))}

        <div style={{ fontWeight: 'bold', fontSize: 13.5, color: '#222222', margin: '18px 0 8px' }}>Terms &amp; Conditions:</div>
        <ol style={{ margin: '0 0 0 20px', paddingLeft: 15, fontSize: 10, lineHeight: 1.6 }}>
          <li>Quotation subject to revision based on final 3D design.</li>
          <li>Standard wardrobe modules included; extra drawers at additional cost.</li>
          <li>Warranty will not be applicable for physical damage.</li>
        </ol>

        <div style={{ marginTop: 30, textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', fontStyle: 'italic', color: '#17365D', marginBottom: 4 }}>THANK YOU!</div>
          <div style={{ fontSize: 9.5, fontStyle: 'italic', color: '#555', marginBottom: 6 }}>For any queries, feel free to contact us.</div>
          <div style={{ fontSize: 11.5, fontWeight: 'bold', color: '#0F243E' }}>TEAM VISTARA INTERIORS</div>
        </div>
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
  padding: '6px 8px', border: '1px solid #000', fontSize: '10pt',
  fontWeight: 'bold', background: '#0F243E', color: '#fff', textAlign: 'center',
  verticalAlign: 'middle'
};
const tdStyle = {
  padding: '5px 8px', border: '1px solid #000', fontSize: '9.5pt',
  verticalAlign: 'middle'
};
