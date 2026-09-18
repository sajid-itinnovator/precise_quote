import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWords, formatDate, cleanCustomerProjectTitle } from './helpers.js';
import { DEFAULT_PAYMENT_TERMS } from '../context/AppContext.jsx';

const BRAND_BLUE = [26, 86, 255];      // #1a56ff
const DARK_NAVY = [15, 36, 62];        // #0F243E (matching Word doc table headers and theme)
const TITLE_BLUE = [23, 54, 93];       // #17365D (matching Word doc company name)
const GRAY_HEADER = [191, 191, 191];   // #BFBFBF (matching Word doc category rows)
const TEXT_DARK = [34, 34, 34];        // #222222 (matching Word doc headings)
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [245, 247, 252];
const BLACK = [0, 0, 0];

export function hexToRgb(hex, fallback = [26, 86, 255]) {
  if (!hex || typeof hex !== 'string') return fallback;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? fallback : [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? fallback : [r, g, b];
  }
  return fallback;
}

function addPageBorder(doc, themeColor = DARK_NAVY) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...themeColor);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, w - 16, h - 16);
}

function addHeader(doc, quotation, companyProfile = null) {
  const w = doc.internal.pageSize.getWidth();

  const compName = companyProfile?.companyName || quotation?.tenantName || "INTERIOR STUDIO";
  const compTagline = companyProfile?.tagline !== undefined ? companyProfile.tagline : '';
  const compAddress = companyProfile?.officeAddress || '';
  const compPhone = companyProfile?.phone || '';
  const compEmail = companyProfile?.email || '';
  const compGst = companyProfile?.gstNumber ? `GST: ${companyProfile.gstNumber}` : '';
  const compLogo = companyProfile?.logo;

  // Logo area (left square box or image)
  let logoLoaded = false;
  if (compLogo) {
    try {
      doc.addImage(compLogo, 'PNG', 14, 14, 30, 28);
      logoLoaded = true;
    } catch {
      try {
        doc.addImage(compLogo, 'JPEG', 14, 14, 30, 28);
        logoLoaded = true;
      } catch {}
    }
  }

  if (!logoLoaded) {
    doc.setFillColor(...DARK_NAVY);
    doc.rect(14, 14, 30, 28, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(20);
    doc.setFont('times', 'bold');
    const initialLetter = (compName || 'V').trim().charAt(0).toUpperCase();
    doc.text(initialLetter, 29, 34, { align: 'center' });
    doc.setFontSize(6);
    doc.setFont('times', 'normal');
    const badgeText = compName.length > 10 ? compName.substring(0, 10).toUpperCase() : compName.toUpperCase();
    doc.text(badgeText, 29, 39, { align: 'center' });
  }

  // Company name
  doc.setTextColor(...TITLE_BLUE);
  doc.setFontSize(20);
  doc.setFont('times', 'bold');
  doc.text(compName.toUpperCase(), 48, 26);

  // Tagline
  if (compTagline) {
    doc.setFontSize(9.5);
    doc.setFont('times', 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text(compTagline, 48, 33);
  }

  // Divider line
  doc.setDrawColor(...DARK_NAVY);
  doc.setLineWidth(0.4);
  doc.line(14, 46, w - 14, 46);

  // Company details
  doc.setFontSize(8.5);
  doc.setFont('times', 'normal');
  doc.setTextColor(...BLACK);
  doc.text(`Office Address: ${compAddress}`, 14, 52);
  doc.text(`Contact: ${compPhone}`, 14, 58);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`Email: ${compEmail}`, 100, 58);
  doc.setTextColor(...BLACK);
  doc.text(`Date: ${formatDate(quotation.date)}`, 14, 64);
  const quoteAndGst = `${quotation.quotationNo ? `Quotation No: ${quotation.quotationNo}` : ''}${compGst ? `  |  ${compGst}` : ''}`;
  doc.text(quoteAndGst, 100, 64);

  // Divider
  doc.line(14, 68, w - 14, 68);

  return 70; // y position after header
}

function addClientDetails(doc, quotation, startY) {
  const w = doc.internal.pageSize.getWidth();

  // Section title (centered per reference)
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK_NAVY);
  doc.text('CLIENT DETAILS', w / 2, startY + 5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.setTextColor(...BLACK);
  doc.text(`Client Name: ${quotation.clientName || ''}`, 16, startY + 12);
  doc.text(`Contact: ${quotation.clientContact || ''}`, 16, startY + 18);
  doc.text(`Billing Address: ${quotation.clientAddress || ''}`, 16, startY + 24);

  doc.setDrawColor(180, 180, 180);
  doc.line(14, startY + 28, w - 14, startY + 28);

  // Project title (clean customer-facing title)
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TITLE_BLUE);
  const cleanTitle = cleanCustomerProjectTitle(quotation.projectTitle) || 'INTERIOR DESIGN';
  doc.text(cleanTitle, w / 2, startY + 36, { align: 'center' });

  return startY + 44;
}

function buildScopeTable(quotation) {
  const body = [];
  let srNo = 1;
  const showAmount = quotation.showItemAmount !== false;
  const colSpan = showAmount ? 4 : 3;

  (quotation.rooms || []).forEach(room => {
    // Room headline row with #BFBFBF silver gray background and bold black text centered
    body.push([{ 
      content: room.name, 
      colSpan: colSpan, 
      styles: { 
        fillColor: GRAY_HEADER, 
        textColor: BLACK, 
        fontStyle: 'bold', 
        halign: 'center', 
        valign: 'middle',
        fontSize: 9.5 
      } 
    }]);

    (room.items || []).forEach(item => {
      const row = [
        { content: String(srNo++), styles: { halign: 'center', valign: 'middle' } },
        { content: item.particular || '', styles: { halign: 'left', valign: 'middle' } },
        { content: item.size || '', styles: { halign: 'center', valign: 'middle' } },
      ];
      if (showAmount) {
        row.push({ content: item.amount ? Number(item.amount).toLocaleString('en-IN') : '', styles: { halign: 'center', valign: 'middle' } });
      }
      body.push(row);
    });
  });

  return body;
}

function addScopeOfWork(doc, quotation, startY, themeColor = DARK_NAVY) {
  const w = doc.internal.pageSize.getWidth();
  const showAmount = quotation.showItemAmount !== false;

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text('SCOPE OF WORK:', 14, startY);

  const body = buildScopeTable(quotation);
  const total = (quotation.rooms || []).reduce((sum, room) =>
    sum + (room.items || []).reduce((s, item) => s + (Number(item.amount) || 0), 0), 0);

  const head = showAmount ? [[
    { content: 'SR .NO', styles: { halign: 'center', valign: 'middle' } },
    { content: 'PARTICULAR', styles: { halign: 'center', valign: 'middle' } },
    { content: 'SIZE', styles: { halign: 'center', valign: 'middle' } },
    { content: 'AMOUNT', styles: { halign: 'center', valign: 'middle' } },
  ]] : [[
    { content: 'SR .NO', styles: { halign: 'center', valign: 'middle' } },
    { content: 'PARTICULAR', styles: { halign: 'center', valign: 'middle' } },
    { content: 'SIZE', styles: { halign: 'center', valign: 'middle' } },
  ]];

  const columnStyles = showAmount ? {
    0: { cellWidth: 16, halign: 'center', valign: 'middle' },
    1: { cellWidth: 'auto', halign: 'left', valign: 'middle' },
    2: { cellWidth: 38, halign: 'center', valign: 'middle' },
    3: { cellWidth: 30, halign: 'center', valign: 'middle' },
  } : {
    0: { cellWidth: 16, halign: 'center', valign: 'middle' },
    1: { cellWidth: 'auto', halign: 'left', valign: 'middle' },
    2: { cellWidth: 45, halign: 'center', valign: 'middle' },
  };

  autoTable(doc, {
    startY: startY + 4,
    head,
    body,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 3, textColor: BLACK, valign: 'middle' },
    headStyles: { fillColor: themeColor, textColor: WHITE, fontStyle: 'bold', fontSize: 9, valign: 'middle' },
    columnStyles,
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    didParseCell: (data) => {
      if (data.row.raw && Array.isArray(data.row.raw) && data.row.raw[0]?.colSpan) {
        data.cell.styles.fillColor = GRAY_HEADER;
        data.cell.styles.textColor = BLACK;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
      }
    },
  });

  const afterTable = doc.lastAutoTable.finalY + 6;

  // Total box (centered styling matching Word)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(14, afterTable, w - 14, afterTable);
  doc.line(14, afterTable + 18, w - 14, afterTable + 18);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(`COMPLETE INTERIOR TOTAL BUDGET – APPROX. Rs. ${total.toLocaleString('en-IN')}/-`, w / 2, afterTable + 7, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text(`AMOUNT IN WORDS – ${numberToWords(total).replace('Rupees ', '').replace(' Rupees', '')} Only`, w / 2, afterTable + 13, { align: 'center' });

  return afterTable + 24;
}

function addMaterialSpec(doc, materialSpec, startY, themeColor = DARK_NAVY) {
  let y = startY || 20;
  // If not enough room on current page, add new page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text('MATERIAL SPECIFICATION:', 14, y);
  y += 4;

  const body = [];
  let srNo = 1;

  (materialSpec || []).forEach(cat => {
    // Category headline row
    body.push([{ 
      content: cat.category, 
      colSpan: 3, 
      styles: { 
        fillColor: GRAY_HEADER, 
        textColor: BLACK, 
        fontStyle: 'bold', 
        halign: 'center', 
        valign: 'middle',
        fontSize: 9.5 
      } 
    }]);
    (cat.items || []).forEach(item => {
      body.push([
        { content: String(srNo++), styles: { halign: 'center', valign: 'middle' } },
        { content: item.material || '', styles: { halign: 'left', valign: 'middle' } },
        { content: item.brand || '', styles: { halign: 'center', valign: 'middle' } },
      ]);
    });
  });

  autoTable(doc, {
    startY: y,
    head: [[
      { content: 'SR .NO', styles: { halign: 'center', valign: 'middle' } },
      { content: 'MATERIAL', styles: { halign: 'center', valign: 'middle' } },
      { content: 'BRAND', styles: { halign: 'center', valign: 'middle' } },
    ]],
    body,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 3, textColor: BLACK, valign: 'middle' },
    headStyles: { fillColor: themeColor, textColor: WHITE, fontStyle: 'bold', fontSize: 9, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', valign: 'middle' },
      1: { cellWidth: 65, halign: 'left', valign: 'middle' },
      2: { cellWidth: 'auto', halign: 'center', valign: 'middle' },
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    didParseCell: (data) => {
      if (data.row.raw && Array.isArray(data.row.raw) && data.row.raw[0]?.colSpan === 3) {
        data.cell.styles.fillColor = GRAY_HEADER;
        data.cell.styles.textColor = BLACK;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
      }
    },
  });

  return doc.lastAutoTable.finalY + 10;
}

function addServicesTerms(doc, startY, companyProfile = null, quotation = null) {
  let y = startY;
  const w = doc.internal.pageSize.getWidth();
  const compName = companyProfile?.companyName || quotation?.tenantName || "Our Studio";

  // Check if we need a new page
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text('1. Design & Execution:', 14, y);
  y += 5.5;
  const designItems = [
    '2D & 3D Designing & Visualization',
    'Material Selection Assistance',
    'On-site Supervision',
    'Installation & Finishing Work',
    'Project Timeline: 60–65 Days',
  ];
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  designItems.forEach(item => { doc.text(`• ${item}`, 18, y); y += 4.5; });

  y += 3;
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`2. Why Choose ${compName}?`, 14, y);
  y += 5.5;
  const whyItems = [
    'Transparent Pricing – No Hidden Charges',
    'High-Quality Materials & Craftsmanship',
    'Personalized Design with 3D Views',
    '10-Year Warranty on Workmanship',
    'Professional Team with End-to-End Support',
    'Deep Cleaning will be provided by us',
    'All Furniture Edge Work Will Be Done In Laminate Matching PVC Edge Binds to Ensure Smooth Edges and Seamless Finishing',
  ];
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  whyItems.forEach(item => {
    const lines = doc.splitTextToSize(`• ${item}`, w - 32);
    doc.text(lines, 18, y);
    y += lines.length * 4.5;
  });

  y += 3;
  if (y > 230) { doc.addPage(); y = 20; }

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Terms & Conditions:', 14, y);
  y += 5.5;
  const termsItems = [
    '1. Quotation subject to revision based on final 3D design.',
    '2. Standard wardrobe modules included; extra drawers at additional cost.',
    '3. Warranty will not be applicable for physical damage.',
  ];
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  termsItems.forEach(item => { doc.text(item, 18, y); y += 4.5; });

  y += 5;

  // Payment Terms & Schedule (customized per quotation or tenant default)
  const paymentTermsText = quotation?.paymentTerms !== undefined
    ? quotation.paymentTerms
    : (companyProfile?.paymentTerms || DEFAULT_PAYMENT_TERMS);

  if (paymentTermsText) {
    if (y > 215) { doc.addPage(); y = 20; }
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...TITLE_BLUE);
    doc.text('PAYMENT TERMS & SCHEDULE:', 14, y);
    y += 5;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    const lines = paymentTermsText.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const wrapped = doc.splitTextToSize(line.trim(), w - 28);
        doc.text(wrapped, 18, y);
        y += wrapped.length * 4.2;
      }
    });
    y += 4;
  }

  // Payment Details Block (Bank, UPI, QR Code, Stamp & Signature) if present
  const compBank = companyProfile?.bankDetails;
  const hasBank = compBank && (compBank.accountNumber || compBank.bankName || compBank.ifscCode);
  const compUpi = companyProfile?.upiId;
  const compQr = companyProfile?.qrCode;
  const compStamp = companyProfile?.stamp;
  const compSig = companyProfile?.signature;
  const showBottomLogo = companyProfile?.showBottomLogo !== false;
  const bottomLogo = showBottomLogo ? (companyProfile?.bottomLogo || companyProfile?.logo) : null;

  if (hasBank || compUpi || compQr || compStamp || compSig || bottomLogo) {
    if (y > 230) { doc.addPage(); y = 20; }
    
    // Payment details box
    doc.setDrawColor(210, 210, 210);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(14, y, w - 28, 30, 2, 2, 'FD');

    // Left: Bank details
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...TITLE_BLUE);
    doc.text('PAYMENT DETAILS', 18, y + 5.5);

    doc.setFont('times', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_DARK);
    let by = y + 10;
    if (compBank?.bankName) {
      doc.text(`Bank: ${compBank.bankName} ${compBank.branchName ? `(${compBank.branchName})` : ''}`, 18, by);
      by += 3.8;
    }
    if (compBank?.accountHolderName) {
      doc.text(`A/C Name: ${compBank.accountHolderName}`, 18, by);
      by += 3.8;
    }
    if (compBank?.accountNumber) {
      doc.text(`A/C No: ${compBank.accountNumber}   |   IFSC: ${compBank.ifscCode || '—'}`, 18, by);
      by += 3.8;
    }
    if (compUpi) {
      doc.text(`UPI ID: ${compUpi}`, 18, by);
      by += 3.8;
    }

    // QR Code in middle if available
    if (compQr) {
      try {
        doc.addImage(compQr, 'PNG', 110, y + 3, 23, 23);
        doc.setFontSize(6.5);
        doc.setFont('times', 'bold');
        doc.text('SCAN TO PAY', 121.5, y + 28, { align: 'center' });
      } catch {
        try { 
          doc.addImage(compQr, 'JPEG', 110, y + 3, 23, 23); 
          doc.setFontSize(6.5);
          doc.setFont('times', 'bold');
          doc.text('SCAN TO PAY', 121.5, y + 28, { align: 'center' });
        } catch {}
      }
    }

    // Right: Stamp & Signature & Logo
    const rightX = w - 18;
    if (bottomLogo) {
      try {
        doc.addImage(bottomLogo, 'PNG', rightX - (compStamp ? 66 : 42), y + 3, 20, 15);
      } catch {
        try { doc.addImage(bottomLogo, 'JPEG', rightX - (compStamp ? 66 : 42), y + 3, 20, 15); } catch {}
      }
    }
    if (compStamp) {
      try {
        doc.addImage(compStamp, 'PNG', rightX - 44, y + 3, 19, 19);
      } catch {
        try { doc.addImage(compStamp, 'JPEG', rightX - 44, y + 3, 19, 19); } catch {}
      }
    }
    if (compSig) {
      try {
        doc.addImage(compSig, 'PNG', rightX - 22, y + 5, 20, 15);
      } catch {
        try { doc.addImage(compSig, 'JPEG', rightX - 22, y + 5, 20, 15); } catch {}
      }
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK_NAVY);
    doc.text('Authorized Signatory', rightX, y + 27.5, { align: 'right' });

    y += 35;
  }

  y += 4;

  // Thank you section (aligned at right side, with bottom logo on left side)
  if (y > 255) { doc.addPage(); y = 25; }

  if (bottomLogo) {
    try {
      doc.addImage(bottomLogo, 'PNG', 14, y - 2, 28, 18);
    } catch {
      try { doc.addImage(bottomLogo, 'JPEG', 14, y - 2, 28, 18); } catch {}
    }
  }

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(12);
  doc.setTextColor(...TITLE_BLUE);
  doc.text('THANK YOU!', w - 14, y, { align: 'right' });
  y += 5;
  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('For any queries, feel free to contact us.', w - 14, y, { align: 'right' });
  y += 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK_NAVY);
  const signoffCompany = companyProfile?.companyName || quotation?.tenantName || 'OUR TEAM';
  const displaySignoff = signoffCompany.toUpperCase().startsWith('TEAM ') ? signoffCompany.toUpperCase() : `TEAM ${signoffCompany.toUpperCase()}`;
  doc.text(displaySignoff, w - 14, y, { align: 'right' });
}

export function buildQuotationPDFDoc(quotation, companyProfile = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const themeColor = hexToRgb(companyProfile?.brandColor, DARK_NAVY);

  let y = addHeader(doc, quotation, companyProfile);
  y = addClientDetails(doc, quotation, y);
  const scopeEndY = addScopeOfWork(doc, quotation, y + 4, themeColor);

  // Material spec appears immediately after total if space permits
  const specY = addMaterialSpec(doc, quotation.materialSpec, scopeEndY + 6, themeColor);
  addServicesTerms(doc, specY, companyProfile, quotation);

  // Apply border to ALL pages (guarantees autoTable-generated multi-page splits and all pages have borders)
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageBorder(doc, themeColor);
  }

  return doc;
}

export function generateQuotationPDF(quotation, customFileName, companyProfile = null) {
  const doc = buildQuotationPDFDoc(quotation, companyProfile);
  const companyPrefix = (companyProfile?.companyName || quotation?.tenantName || 'PreciseQuote').replace(/[^a-zA-Z0-9]/g, '');
  const cleanName = (customFileName || `${companyPrefix}_Invoice_${quotation.quotationNo || 'Quote'}_${quotation.clientName?.replace(/\s+/g, '_') || 'Client'}`).trim();
  const fileName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
  doc.save(fileName);
  return fileName;
}
