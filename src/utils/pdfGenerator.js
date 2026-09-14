import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWords, formatDate, cleanCustomerProjectTitle } from './helpers';

const BRAND_BLUE = [26, 86, 255];      // #1a56ff
const DARK_NAVY = [15, 36, 62];        // #0F243E (matching Word doc table headers and theme)
const TITLE_BLUE = [23, 54, 93];       // #17365D (matching Word doc company name)
const GRAY_HEADER = [191, 191, 191];   // #BFBFBF (matching Word doc category rows)
const TEXT_DARK = [34, 34, 34];        // #222222 (matching Word doc headings)
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [245, 247, 252];
const BLACK = [0, 0, 0];

function addPageBorder(doc) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...DARK_NAVY);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, w - 16, h - 16);
}

function addHeader(doc, quotation) {
  const w = doc.internal.pageSize.getWidth();

  // Logo area (left square box)
  doc.setFillColor(...DARK_NAVY);
  doc.rect(14, 14, 30, 28, 'F');
  // "V" letter in box
  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont('times', 'bold');
  doc.text('V', 29, 34, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('times', 'normal');
  doc.text('VISTARA', 29, 39, { align: 'center' });

  // Company name
  doc.setTextColor(...TITLE_BLUE);
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.text("VISTARA INTERIOR'S", 50, 26);

  // Tagline
  doc.setFontSize(9.5);
  doc.setFont('times', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text('Designing Dreams Creating Reality......', 50, 33);

  // Divider line
  doc.setDrawColor(...DARK_NAVY);
  doc.setLineWidth(0.4);
  doc.line(14, 46, w - 14, 46);

  // Company details
  doc.setFontSize(8.5);
  doc.setFont('times', 'normal');
  doc.setTextColor(...BLACK);
  doc.text('Office Address: Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060', 14, 52);
  doc.text('Contact: +91 7720097476/8482946451', 14, 58);
  doc.setTextColor(...BRAND_BLUE);
  doc.text('Email: teamvistarainteriors@gmail.com', 100, 58);
  doc.setTextColor(...BLACK);
  doc.text(`Date: ${formatDate(quotation.date)}`, 14, 64);
  doc.text(`Quotation No: ${quotation.quotationNo || ''}`, 100, 64);

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

  (quotation.rooms || []).forEach(room => {
    // Room header row with #BFBFBF silver gray background and bold black text
    body.push([{ content: room.name, colSpan: 4, styles: { fillColor: GRAY_HEADER, textColor: BLACK, fontStyle: 'bold', halign: 'center', fontSize: 9 } }]);

    (room.items || []).forEach(item => {
      body.push([
        { content: String(srNo++), styles: { halign: 'center' } },
        item.particular || '',
        { content: item.size || '', styles: { halign: 'center' } },
        { content: item.amount ? Number(item.amount).toLocaleString('en-IN') : '', styles: { halign: 'right' } },
      ]);
    });
  });

  return body;
}

function addScopeOfWork(doc, quotation, startY) {
  const w = doc.internal.pageSize.getWidth();

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text('SCOPE OF WORK:', 14, startY);

  const body = buildScopeTable(quotation);
  const total = (quotation.rooms || []).reduce((sum, room) =>
    sum + (room.items || []).reduce((s, item) => s + (Number(item.amount) || 0), 0), 0);

  autoTable(doc, {
    startY: startY + 4,
    head: [[
      { content: 'SR .NO', styles: { halign: 'center' } },
      'Particular',
      { content: 'Size', styles: { halign: 'center' } },
      { content: 'Amount', styles: { halign: 'right' } },
    ]],
    body,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 3, textColor: BLACK },
    headStyles: { fillColor: DARK_NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    didParseCell: (data) => {
      if (data.row.raw && Array.isArray(data.row.raw) && data.row.raw[0]?.colSpan === 4) {
        data.cell.styles.fillColor = GRAY_HEADER;
        data.cell.styles.textColor = BLACK;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
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
  doc.text(`COMPLETE INTERIOR TOTAL BUDGET – APPROX. ₹${total.toLocaleString('en-IN')}/-`, w / 2, afterTable + 7, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text(`AMOUNT IN WORDS – ${numberToWords(total).replace('Rupees ', '').replace(' Rupees', '')} Only`, w / 2, afterTable + 13, { align: 'center' });

  return afterTable + 24;
}

function addMaterialSpec(doc, materialSpec, startY) {
  let y = startY || 20;
  // If not enough room on current page, add new page
  if (y > 220) {
    doc.addPage();
    addPageBorder(doc);
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
    // Category header row
    body.push([{ 
      content: cat.category, 
      colSpan: 3, 
      styles: { 
        fillColor: GRAY_HEADER, 
        textColor: BLACK, 
        fontStyle: 'bold', 
        halign: 'center', 
        fontSize: 9 
      } 
    }]);
    (cat.items || []).forEach(item => {
      body.push([
        { content: String(srNo++), styles: { halign: 'center' } },
        item.material || '',
        { content: item.brand || '', styles: { halign: 'center' } },
      ]);
    });
  });

  autoTable(doc, {
    startY: y,
    head: [[
      { content: 'SR .NO', styles: { halign: 'center' } },
      'MATERIAL',
      { content: 'BRAND', styles: { halign: 'center' } },
    ]],
    body,
    theme: 'grid',
    styles: { font: 'times', fontSize: 8.5, cellPadding: 3, textColor: BLACK },
    headStyles: { fillColor: DARK_NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 65, halign: 'left' },
      2: { cellWidth: 'auto', halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    didParseCell: (data) => {
      if (data.row.raw && Array.isArray(data.row.raw) && data.row.raw[0]?.colSpan === 3) {
        data.cell.styles.fillColor = GRAY_HEADER;
        data.cell.styles.textColor = BLACK;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
      }
    },
  });

  return doc.lastAutoTable.finalY + 10;
}

function addServicesTerms(doc, startY) {
  let y = startY;
  const w = doc.internal.pageSize.getWidth();

  // Check if we need a new page
  if (y > 220) { doc.addPage(); addPageBorder(doc); y = 20; }

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
  if (y > 220) { doc.addPage(); addPageBorder(doc); y = 20; }

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text('2. Why Choose Vistara Interiors?', 14, y);
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
  if (y > 230) { doc.addPage(); addPageBorder(doc); y = 20; }

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

  y += 8;

  // Thank you section
  if (y > 250) { doc.addPage(); addPageBorder(doc); y = 25; }
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(12);
  doc.setTextColor(...TITLE_BLUE);
  doc.text('THANK YOU!', w / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('For any queries, feel free to contact us.', w / 2, y, { align: 'center' });
  y += 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK_NAVY);
  doc.text('TEAM VISTARA INTERIORS', w / 2, y, { align: 'center' });
  y += 8;

  // Logo footer
  if (y <= 270) {
    doc.setFillColor(...DARK_NAVY);
    doc.rect(w / 2 - 10, y, 20, 16, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...WHITE);
    doc.text('V', w / 2, y + 10, { align: 'center' });
    doc.setFontSize(4.5);
    doc.text('VISTARA', w / 2, y + 14, { align: 'center' });
  }
}

export function buildQuotationPDFDoc(quotation) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  addPageBorder(doc);
  let y = addHeader(doc, quotation);
  y = addClientDetails(doc, quotation, y);
  const scopeEndY = addScopeOfWork(doc, quotation, y + 4);

  // Material spec appears immediately after total if space permits
  const specY = addMaterialSpec(doc, quotation.materialSpec, scopeEndY + 6);
  addServicesTerms(doc, specY);

  return doc;
}

export function generateQuotationPDF(quotation, customFileName) {
  const doc = buildQuotationPDFDoc(quotation);
  const cleanName = (customFileName || `Vistara_Invoice_${quotation.quotationNo || 'Quote'}_${quotation.clientName?.replace(/\s+/g, '_') || 'Client'}`).trim();
  const fileName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
  doc.save(fileName);
  return fileName;
}
