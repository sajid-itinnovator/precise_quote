import React, { useState } from 'react';
import { X, Send, Download, Phone, FileText, CheckCircle, MessageSquare } from 'lucide-react';
import { buildQuotationPDFDoc, generateQuotationPDF } from '../utils/pdfGenerator';
import { formatIndianCurrency, formatDate, cleanCustomerProjectTitle } from '../utils/helpers';
import { useApp } from '../context/AppContext';

export default function WhatsAppShareModal({ quotation, onClose, onInvoiceSent }) {
  const { updateQuotation } = useApp();

  // Generate a clean default filename: Vistara_Invoice_<No>_<ClientName>
  const defaultBaseName = `Vistara_Invoice_${quotation.quotationNo || 'Quote'}_${(quotation.clientName || 'Client').trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  
  const [fileName, setFileName] = useState(defaultBaseName);
  
  // Format phone number (pre-fill from client contact if available)
  const initialPhone = (quotation.clientContact || '').replace(/[^0-9]/g, '');
  const [phone, setPhone] = useState(initialPhone);

  const total = quotation.total ||
    (quotation.rooms || []).reduce((s, r) =>
      s + (r.items || []).reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0);

  // Clean customer-facing title without version numbers
  const displayProjectTitle = cleanCustomerProjectTitle(quotation.projectTitle || quotation.projectName) || 'Interior Project';

  // Pre-filled professional WhatsApp message template
  const defaultMsg = 
`Dear ${quotation.clientName || 'Client'},

Greetings from *Vistara Interior's*! ✨

Please find attached your detailed interior quotation/invoice for *${displayProjectTitle}*.

📄 *Quotation No:* QT-${quotation.quotationNo}
📅 *Date:* ${formatDate(quotation.date || new Date().toISOString())}
💰 *Total Amount:* ${formatIndianCurrency(total)}

Kindly review the attached PDF document. Please feel free to reach out if you have any questions or require modifications.

Warm regards,
*Vistara Interior's*
📞 +91 7720097476 / +91 8482946451`;

  const [message, setMessage] = useState(defaultMsg);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sanitize file name ensuring .pdf
  const getFullFileName = () => {
    const clean = (fileName || defaultBaseName).trim();
    return clean.toLowerCase().endsWith('.pdf') ? clean : `${clean}.pdf`;
  };

  const handleSendWhatsApp = async () => {
    setIsSharing(true);
    const finalFileName = getFullFileName();

    // 1. Update quotation status to 'INVOICE CREATED' if it was in DRAFT
    if (quotation.id && updateQuotation && quotation.status === 'DRAFT') {
      try {
        await updateQuotation(quotation.id, { status: 'INVOICE CREATED' });
        if (onInvoiceSent) onInvoiceSent();
      } catch (err) {
        console.error('Failed to update status on share', err);
      }
    }

    try {
      // 2. Generate PDF Blob
      const doc = buildQuotationPDFDoc(quotation);
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], finalFileName, { type: 'application/pdf' });

      // 3. Check if Web Share API with files is supported (primarily mobile browsers)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: finalFileName,
            text: message,
            files: [pdfFile],
          });
          setIsSharing(false);
          onClose();
          return;
        } catch (shareErr) {
          // If user aborted or share failed, fallback to download + WhatsApp Web/app URL
          if (shareErr.name !== 'AbortError') {
            console.warn('Native share failed, falling back to download & wa.me link', shareErr);
          } else {
            setIsSharing(false);
            return;
          }
        }
      }

      // 4. Fallback for Desktop / browsers without file sharing:
      // Download PDF to user's device with custom filename
      doc.save(finalFileName);

      // Clean phone number for wa.me URL
      let cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`; // Default India country code if 10 digits
      }

      // Open WhatsApp chat with prefilled message
      const encodedText = encodeURIComponent(message);
      const waUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;

      window.open(waUrl, '_blank');
      setIsSharing(false);
      onClose();
    } catch (e) {
      console.error('Error generating PDF or sharing:', e);
      setIsSharing(false);
      alert('Could not share. Please try again.');
    }
  };

  const handleDownloadOnly = () => {
    const finalFileName = getFullFileName();
    generateQuotationPDF(quotation, finalFileName);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 560, width: '92%' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.1rem', margin: 0 }}>Send Invoice via WhatsApp</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Customize the PDF file name and review the client message
              </p>
            </div>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
          {/* File Name Customization */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <FileText size={15} style={{ color: 'var(--primary)' }} />
              Invoice File Name
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="e.g. Vistara_Invoice_QT1287_Sharma"
              />
              <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>.pdf</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              The client will receive or download the invoice with this exact file name.
            </span>
          </div>

          {/* Client WhatsApp Number */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Phone size={15} style={{ color: '#25D366' }} />
              WhatsApp Phone Number (with Country Code)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 919876543210 or 9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              10-digit Indian numbers will automatically be prefixed with +91.
            </span>
          </div>

          {/* WhatsApp Message Preview & Edit */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>WhatsApp Message</label>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.72rem', padding: '2px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => {
                  navigator.clipboard.writeText(message);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckCircle size={12} color="#10b981" /> : null}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <textarea
              className="form-input"
              rows={6}
              style={{ fontSize: '0.8rem', lineHeight: '1.4', resize: 'vertical' }}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          {/* Note on Sharing */}
          <div style={{
            background: 'rgba(37, 211, 102, 0.08)',
            border: '1px solid rgba(37, 211, 102, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4
          }}>
            💡 <strong>How it works:</strong> Clicking <em>Send on WhatsApp</em> will download the customized PDF file to your device and open the client's chat in WhatsApp with your message ready. Just drag or attach the downloaded PDF file into the WhatsApp chat! On supported mobile devices, it directly attaches the file in WhatsApp.
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 10
        }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadOnly}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Download PDF Only
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={isSharing}
              onClick={handleSendWhatsApp}
              style={{
                background: '#25D366', color: '#fff', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6, border: 'none',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.4)'
              }}
            >
              <Send size={14} />
              {isSharing ? 'Preparing...' : 'Send on WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
