import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { buildPrintNode, disposePrintNode } from './printRenderer';

/**
 * PDF generation for quotations. There is no second invoice drawing here:
 * the PDF is a capture of the SAME QuotationDocument the in-app preview and
 * the browser print window render, sliced into A4 pages.
 */

const A4 = { W: 210, H: 297 };
const MARGIN = { left: 10, right: 10, top: 10, bottom: 10 };

async function renderDocToCanvas(quotation, tenantName, tenantLogo, companyProfile, paymentTerms) {
  const node = await buildPrintNode(quotation, tenantName, tenantLogo, companyProfile, paymentTerms);
  try {
    return await html2canvas(node.host.firstElementChild, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  } finally {
    disposePrintNode(node);
  }
}

/** Slice the full-height capture into page-height strips, one PDF page per strip. */
async function canvasToPdf(canvas) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageInnerW = A4.W - MARGIN.left - MARGIN.right;
  const pageInnerH = A4.H - MARGIN.top - MARGIN.bottom;
  const imgH = (canvas.height / canvas.width) * pageInnerW; // proportional image height at inner width
  const pageCount = Math.max(1, Math.ceil(imgH / pageInnerH));

  for (let p = 0; p < pageCount; p++) {
    if (p > 0) doc.addPage();

    // One-page docs embed the canvas directly; multi-page docs slice strips
    // at native pixel resolution so nothing is scaled twice.
    if (pageCount === 1) {
      const imgHOnPage = Math.min(imgH, pageInnerH);
      doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN.left, MARGIN.top, pageInnerW, imgHOnPage, undefined, 'FAST');
      break;
    }

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    const sliceH = Math.ceil((pageInnerH / imgH) * canvas.height);
    const y = p * sliceH;
    const h = Math.min(sliceH, canvas.height - y);
    if (h <= 0) break;

    sliceCanvas.height = h;
    const ctx = sliceCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, h);
    ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);

    const sliceImgH = (h / canvas.width) * pageInnerW;
    doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN.left, MARGIN.top, pageInnerW, sliceImgH, undefined, 'FAST');
  }

  return doc;
}

/** Build the quotation PDF (same document as preview/print) without saving. */
export async function buildQuotationPDFDoc(quotation, companyProfile = null, tenantName = 'Workspace', tenantLogo = null) {
  const canvas = await renderDocToCanvas(
    quotation,
    tenantName,
    tenantLogo,
    companyProfile,
    quotation.paymentTerms !== undefined ? quotation.paymentTerms : null
  );
  return canvasToPdf(canvas);
}

/**
 * Generate and download the quotation PDF. Returns the file name used.
 * (Async since the consolidation: the PDF is rendered from the shared
 * QuotationDocument, so callers must await it.)
 */
export async function generateQuotationPDF(quotation, customFileName, companyProfile = null, tenantName = 'Workspace', tenantLogo = null) {
  const doc = await buildQuotationPDFDoc(quotation, companyProfile, tenantName, tenantLogo);
  const companyPrefix = (companyProfile?.companyName || quotation?.tenantName || 'PreciseQuote').replace(/[^a-zA-Z0-9]/g, '');
  const cleanName = (customFileName || `${companyPrefix}_Invoice_${quotation.quotationNo || 'Quote'}_${quotation.clientName?.replace(/\s+/g, '_') || 'Client'}`).trim();
  const fileName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;
  doc.save(fileName);
  return fileName;
}
