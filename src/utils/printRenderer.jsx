import React from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import QuotationDocument from '../components/QuotationDocument';

/**
 * Bridges the ONE quotation renderer (QuotationDocument, also shown in the
 * in-app preview) to the two output channels that need it outside React:
 *  - buildPrintHTML → the browser print window (static markup + print CSS)
 *  - buildPrintNode → an offscreen live DOM node for html2canvas PDF capture
 * With pdfGenerator drawing from the same node, preview, print, PDF and the
 * WhatsApp-shared PDF all share a single source of invoice presentation.
 */

/** Render QuotationDocument into an offscreen DOM node and wait for layout + images. */
export function buildPrintNode(quotation, tenantName, tenantLogo, companyProfile, paymentTerms) {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-10000px';
    host.style.top = '0';
    host.style.width = '210mm';
    host.style.background = '#fff';
    document.body.appendChild(host);

    const root = createRoot(host);
    root.render(
      <QuotationDocument
        quotation={quotation}
        tenantName={tenantName}
        tenantLogo={tenantLogo}
        companyProfile={companyProfile}
        paymentTerms={paymentTerms}
      />
    );

    requestAnimationFrame(() => requestAnimationFrame(async () => {
      // Ensure embedded images (logo, QR, stamp, signature) are decoded before capture
      await Promise.all(
        Array.from(host.querySelectorAll('img')).map(img =>
          (img.complete ? Promise.resolve() : img.decode().catch(() => {}))
        )
      );
      resolve({ host, root });
    }));
  });
}

/** Remove an offscreen node created by buildPrintNode. Always call after capture. */
export function disposePrintNode({ host, root }) {
  root.unmount();
  host.remove();
}

/** Build the browser-print HTML from the SAME QuotationDocument the preview shows. */
export function buildPrintHTML(quotation, tenantName, tenantLogo, companyProfile, paymentTerms) {
  const docMarkup = renderToStaticMarkup(
    <QuotationDocument
      quotation={quotation}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      companyProfile={companyProfile}
      paymentTerms={paymentTerms}
    />
  );

  const title = `${companyProfile?.companyName || tenantName || 'Quotation'} - ${quotation.clientName}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Cambria, Georgia, "Times New Roman", serif;
      font-size: 10pt; color: #000; background: #fff;
      line-height: 1.4;
    }
    .pq-doc {
      width: 210mm; min-height: 277mm; padding: 12mm;
      margin: 0 auto 10mm; background: #fff;
      border: 1px solid #ccc;
    }
    @media print {
      body { margin: 0; }
      .pq-doc {
        width: 100%; min-height: auto; margin: 0; padding: 0; border: none;
        box-shadow: none;
      }
      @page { size: A4; margin: 12mm; }
      ::-webkit-scrollbar { display: none; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
      .section-title { page-break-after: avoid; break-after: avoid; }
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    td { vertical-align: middle; }
    hr { border: none; border-top: 1px solid #666; margin: 8px 0; }
  </style>
</head>
<body>
${docMarkup}
</body>
</html>`;
}
