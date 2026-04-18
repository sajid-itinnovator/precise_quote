import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWords, formatDate } from './helpers';

const BRAND_BLUE = [26, 86, 255];      // #1a56ff
const DARK_NAVY = [13, 27, 75];        // #0d1b4b
const ORANGE_HEADER = [180, 120, 60];  // table room header color (matches reference)
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
  doc.setFont('helvetica', 'bold');
  doc.text('V', 29, 34, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('VISTARA', 29, 39, { align: 'center' });

  // Company name
  doc.setTextColor(...DARK_NAVY);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("VISTARA INTERIOR'S", 50, 26);

  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text('Designing Dreams Creating Reality......', 50, 33);

  // Divider line
  doc.setDrawColor(...DARK_NAVY);
  doc.setLineWidth(0.4);
  doc.line(14, 46, w - 14, 46);

  // Company details
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
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

  // Section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_NAVY);
  doc.text('CLIENT DETAILS', w / 2, startY + 5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BLACK);
  doc.text(`Client Name: ${quotation.clientName || ''}`, 16, startY + 12);
  doc.text(`Contact: ${quotation.clientContact || ''}`, 16, startY + 18);
  doc.text(`Billing Address: ${quotation.clientAddress || ''}`, 16, startY + 24);

  doc.setDrawColor(180, 180, 180);
  doc.line(14, startY + 28, w - 14, startY + 28);

  // Project title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...DARK_NAVY);
  doc.text(quotation.projectTitle || 'INTERIOR DESIGN', w / 2, startY + 36, { align: 'center' });

  return startY + 44;
}

function buildScopeTable(quotation) {
  const body = [];
  let srNo = 1;

  (quotation.rooms || []).forEach(room => {
    // Room header row
    body.push([{ content: room.name, colSpan: 4, styles: { fillColor: [180, 120, 50], textColor: WHITE, fontStyle: 'bold', halign: 'center', fontSize: 9 } }]);

    (room.items || []).forEach(item => {
      body.push([
        { content: String(srNo++), styles: { halign: 'center' } },
        item.particular || '',
        item.size || '',
        { content: item.amount ? Number(item.amount).toLocaleString('en-IN') : '', styles: { halign: 'right' } },
      ]);
    });
  });

  return body;
}

function addScopeOfWork(doc, quotation, startY) {
  const w = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_NAVY);
  doc.text('SCOPE OF WORK', 14, startY);

  const body = buildScopeTable(quotation);
  const total = (quotation.rooms || []).reduce((sum, room) =>
    sum + (room.items || []).reduce((s, item) => s + (Number(item.amount) || 0), 0), 0);

  autoTable(doc, {
    startY: startY + 4,
    head: [[
      { content: 'SR.NO', styles: { halign: 'center' } },
      'Particular',
      'Size',
      { content: 'Amount', styles: { halign: 'right' } },
    ]],
    body,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3, textColor: BLACK },
    headStyles: { fillColor: DARK_NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 38 },
      3: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    didParseCell: (data) => {
      if (data.row.raw && Array.isArray(data.row.raw) && data.row.raw[0]?.colSpan === 4) {
        data.cell.styles.fillColor = [180, 120, 50];
        data.cell.styles.textColor = WHITE;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const afterTable = doc.lastAutoTable.finalY + 6;

  // Total box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, afterTable, w - 28, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_NAVY);
  doc.text(`COMPLETE INTERIOR TOTAL BUDGET – APPROX. ₹${total.toLocaleString('en-IN')}/-`, 20, afterTable + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`AMOUNT IN WORDS: ${numberToWords(total)} Only`, 20, afterTable + 15);

  return afterTable + 26;
}

function addMaterialSpec(doc, materialSpec) {
  doc.addPage();
  addPageBorder(doc);
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...DARK_NAVY);
  doc.text('MATERIAL SPECIFICATION', 14, y);
  y += 6;

  const body = [];
  let srNo = 1;

  (materialSpec || []).forEach(cat => {
    // Category header row
    body.push([{ content: cat.category, colSpan: 3, styles: { fillColor: [180, 120, 50], textColor: WHITE, fontStyle: 'bold', halign: 'center', fontSize: 9 } }]);
    (cat.items || []).forEach(item => {
      body.push([
        { content: String(srNo++), styles: { halign: 'center' } },
        item.material || '',
        item.brand || '',
      ]);
    });
  });

  autoTable(doc, {
    startY: y,
    head: [[
      { content: 'SR.NO', styles: { halign: 'center' } },
      'MATERIAL',
      'BRAND',
    ]],
    body,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3, textColor: BLACK },
    headStyles: { fillColor: DARK_NAVY, textColor: WHITE, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
  });

  return doc.lastAutoTable.finalY + 10;
}

function addServicesTerms(doc, startY) {
  let y = startY;
  const w = doc.internal.pageSize.getWidth();

  const addSection = (title, items, numbered = false) => {
    if (y > 240) { doc.addPage(); addPageBorder(doc); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK_NAVY);
    doc.text(title, 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    items.forEach((item, i) => {
      const lines = doc.splitTextToSize(item, w - 30);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 1;
    });
    y += 4;
  };

  // Check if we need a new page
  if (y > 200) { doc.addPage(); addPageBorder(doc); y = 20; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_NAVY);
  doc.text('1. Design & Execution:', 14, y);
  y += 7;

  const execItems = [
    '• 2D & 3D Designing & Visualization',
    '• Material Selection Assistance',
    '• On-site Supervision',
    '• Installation & Finishing Work',
    '• Project Timeline: 60–65 Days',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  execItems.forEach(item => { doc.text(item, 16, y); y += 5.5; });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_NAVY);
  doc.text('2. Why Choose Vistara Interiors?', 14, y);
  y += 7;

  const whyItems = [
    '• Transparent Pricing – No Hidden Charges',
    '• High-Quality Materials & Craftsmanship',
    '• Personalized Design with 3D Views',
    '• 10-Year Warranty on Workmanship',
    '• Professional Team with End-to-End Support',
    '• Deep Cleaning will provided by us',
    '• All Furniture Edge Work Will Be Done In Laminate Marching PVC Edge Binds to Ensure Smooth Edges and Seamless Finishing',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  whyItems.forEach(item => {
    const lines = doc.splitTextToSize(item, w - 30);
    doc.text(lines, 16, y);
    y += lines.length * 5.5;
  });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_NAVY);
  doc.text('Terms & Conditions:', 14, y);
  y += 6;

  const termsItems = [
    'Quotation subject to revision based on final 3D design.',
    'Standard wardrobe modules included; extra drawers at additional cost.',
    'Warranty will not be applicable for physical damage.',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  termsItems.forEach(item => { doc.text(item, 14, y); y += 5.5; });

  y += 10;

  // Thank you section
  if (y > 250) { doc.addPage(); addPageBorder(doc); y = 30; }
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text('THANK YOU!', w / 2, y, { align: 'center' });
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('For any queries, feel free to contact us.', w / 2, y, { align: 'center' });
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_NAVY);
  doc.text('TEAM VISTARA INTERIORS', w / 2, y, { align: 'center' });
  y += 10;

  // Logo footer
  doc.setFillColor(...DARK_NAVY);
  doc.rect(w / 2 - 12, y, 24, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text('V', w / 2, y + 13, { align: 'center' });
  doc.setFontSize(5);
  doc.text('VISTARA', w / 2, y + 17, { align: 'center' });
}

export function generateQuotationPDF(quotation) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  addPageBorder(doc);
  let y = addHeader(doc, quotation);
  y = addClientDetails(doc, quotation, y);
  addScopeOfWork(doc, quotation, y + 4);

  // Material spec on next page
  const specY = addMaterialSpec(doc, quotation.materialSpec);
  addServicesTerms(doc, specY);

  // Save
  const fileName = `Vistara_Quote_${quotation.quotationNo || 'Draft'}_${quotation.clientName?.replace(/\s+/g, '_') || 'Client'}.pdf`;
  doc.save(fileName);
}
