import { DEFAULT_PAYMENT_TERMS } from '../constants/defaults';

/**
 * Invoice copy + brand/terms resolution — the single source every renderer
 * (QuotationDocument, printRenderer, pdfGenerator) shares.
 */

export const SCOPE_OF_WORK_ITEMS = [
  '2D & 3D Designing & Visualization',
  'Material Selection Assistance',
  'On-site Supervision',
  'Installation & Finishing Work',
  'Project Timeline: 60–65 Days',
];

export const WHY_CHOOSE_ITEMS = [
  'Transparent Pricing – No Hidden Charges',
  'High-Quality Materials & Craftsmanship',
  'Personalized Design with 3D Views',
  '10-Year Warranty on Workmanship',
  'Professional Team with End-to-End Support',
  'Deep Cleaning will be provided by us',
  'All Furniture Edge Work Will Be Done In Laminate Matching PVC Edge Binds to Ensure Smooth Edges and Seamless Finishing',
];

export const TERMS_CONDITIONS = [
  'Quotation subject to revision based on final 3D design.',
  'Standard wardrobe modules included; extra drawers at additional cost.',
  'Warranty will not be applicable for physical damage.',
];

export function resolveBrand(quotation, tenantName, tenantLogo, companyProfile) {
  const compBank = companyProfile?.bankDetails;
  const compLogo = companyProfile?.logo || tenantLogo;
  const showBottomLogo = companyProfile?.showBottomLogo !== false;
  return {
    name: companyProfile?.companyName || quotation?.tenantName || tenantName || 'INTERIOR STUDIO',
    tagline: companyProfile?.tagline !== undefined ? companyProfile.tagline : '',
    address: companyProfile?.officeAddress || '',
    phone: companyProfile?.phone || '',
    email: companyProfile?.email || '',
    gst: companyProfile?.gstNumber || '',
    logo: compLogo,
    bank: compBank,
    hasBank: Boolean(compBank && (compBank.accountNumber || compBank.bankName || compBank.ifscCode)),
    upi: companyProfile?.upiId || '',
    qr: companyProfile?.qrCode || '',
    stamp: companyProfile?.stamp || '',
    signature: companyProfile?.signature || '',
    bottomLogo: showBottomLogo ? (companyProfile?.bottomLogo || compLogo) : null,
  };
}

export function resolvePaymentTerms(quotation, companyProfile, customTerms = null) {
  const terms = customTerms !== null && customTerms !== undefined
    ? customTerms
    : (quotation?.paymentTerms !== undefined ? quotation.paymentTerms : (companyProfile?.paymentTerms || DEFAULT_PAYMENT_TERMS));
  return terms || '';
}
