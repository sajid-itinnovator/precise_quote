/**
 * Platform-wide defaults and presets. Pure data + pure functions — no React,
 * no Firebase — so contexts, renderers and pages can all import them directly.
 */

export const ROOMS_DEFAULT = ['ENTRANCE', 'LIVING ROOM', 'DINING AREA', 'KITCHEN', 'MASTER BEDROOM', 'KIDS BEDROOM', 'BATHROOM', 'CIVIL', 'OTHER WORK'];

export const MATERIAL_SPEC_DEFAULT = [
  { category: 'PLAYWOOD', items: [
    { material: 'Furniture: Gurjan Plywood', brand: 'BWR ISI710 GRADE (18mm & 12mm)' },
    { material: 'Kitchen: Gurjan Plywood', brand: 'BWP ISI710 GRADE (18mm & 12mm)' },
    { material: 'Main door: Gurjan', brand: 'BLOCK BOARD (35mm)' },
  ]},
  { category: 'HARDWARE', items: [
    { material: 'Hardware: Premium Quality', brand: 'ONYX' },
  ]},
  { category: 'LAMINATE', items: [
    { material: 'Laminate', brand: 'ADVANCE / ZARA / BLINCO' },
  ]},
  { category: 'WALL DESIGNING', items: [
    { material: 'Molding', brand: 'POP / PVC' },
    { material: 'Wall Paper', brand: 'WASHABLE PREMIUM' },
  ]},
];

export const calculateNextQuoteNo = (quotesList, currentSettingNo = 1290) => {
  let maxNo = 1289;
  (quotesList || []).forEach(q => {
    const raw = String(q.quotationNo || '');
    const matches = raw.match(/\d+/g);
    if (matches && matches.length > 0) {
      matches.forEach(m => {
        const num = parseInt(m, 10);
        if (!isNaN(num) && num > maxNo && num < 1000000) {
          maxNo = num;
        }
      });
    }
  });
  const fallback = Number(currentSettingNo) || 1290;
  return Math.max(fallback, maxNo + 1);
};

export const DEFAULT_PAYMENT_TERMS = `1. 10% Advance upon confirmation & booking.
2. 40% upon 3D design approval & commencement of production.
3. 40% upon material delivery at site & carcass installation.
4. 10% on project completion & final handover.`;

export const PAYMENT_TERMS_PRESETS = [
  {
    name: '10% - 40% - 40% - 10% (Standard Modular)',
    terms: `1. 10% Advance upon confirmation & booking.
2. 40% upon 3D design approval & commencement of production.
3. 40% upon material delivery at site & carcass installation.
4. 10% on project completion & final handover.`
  },
  {
    name: '50% - 40% - 10% (Fast Track)',
    terms: `1. 50% Advance booking along with design sign-off.
2. 40% upon material delivery at site.
3. 10% upon completion & final handover.`
  },
  {
    name: '30% - 30% - 30% - 10% (Equal Stages)',
    terms: `1. 30% Advance booking & 2D/3D design approval.
2. 30% upon woodwork completion at factory / dispatch.
3. 30% upon site delivery & installation.
4. 10% on completion & final handover.`
  },
  {
    name: '10% - 50% - 35% - 5% (Custom Millwork)',
    terms: `1. 10% Token advance upon confirmation.
2. 50% upon final design & drawings sign-off before manufacturing.
3. 35% upon material delivery at site before installation.
4. 5% upon final handover & inspection.`
  }
];

export const BRAND_COLOR_PRESETS = [
  { name: 'Royal Sapphire', hex: '#1a56ff', dark: '#1240cc', light: '#e8eeff' },
  { name: 'Luxury Gold', hex: '#b45309', dark: '#92400e', light: '#fef3c7' },
  { name: 'Emerald Forest', hex: '#059669', dark: '#047857', light: '#d1fae5' },
  { name: 'Midnight Purple', hex: '#6d28d9', dark: '#5b21b6', light: '#ede9fe' },
  { name: 'Modern Charcoal', hex: '#334155', dark: '#1e293b', light: '#f1f5f9' },
  { name: 'Crimson Rose', hex: '#e11d48', dark: '#be123c', light: '#ffe4e6' },
  { name: 'Bronze Copper', hex: '#c2410c', dark: '#9a3412', light: '#ffedd5' },
];export const VISTARA_BRAND = {
  /** Word-brand navy used by the letterhead, title underline and THANK YOU line. */
  navy: '#17365D',
  /** Scope-table header fill sampled from the reference document. */
  tableHeader: '#0E233D',
  /** Section/room band grey sampled from the reference document. */
  band: '#BFBFBF',
  /** Logo shipped with the app ('/vistara-logo.png'); any tenant can override it in Company Profile. */
  logoUrl: '/vistara-logo.png',
};

export const VISTARA_SAMPLE_PROFILE = {
  companyName: "VISTARA INTERIOR'S",
  tagline: 'Designing Dreams Creating Reality.......',
  officeAddress: 'Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060',
  phone: '+91 7720097476/8482946451',
  email: 'teamvistarainteriors@gmail.com',
  website: '',
  gstNumber: '',
  logo: VISTARA_BRAND.logoUrl,
  signature: null,
  stamp: null,
  brandColor: '#17365D',
  brandColorDark: '#0E233D',
  brandColorLight: '#e8eeff',
  workspaceSubtitle: 'Interior Studio',
  hidePlatformAttribution: true,
  bankDetails: {
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: '',
  },
  upiId: '',
  qrCode: null,
  showBottomLogo: true,
  bottomLogo: null,
  paymentTerms: DEFAULT_PAYMENT_TERMS,
};

export const DEFAULT_COMPANY_PROFILE = {
  companyName: '',
  tagline: '',
  officeAddress: '',
  phone: '',
  email: '',
  website: '',
  gstNumber: '',
  logo: null,
  signature: null,
  stamp: null,
  brandColor: '#1a56ff',
  brandColorDark: '#1240cc',
  brandColorLight: '#e8eeff',
  workspaceSubtitle: 'Interior Studio',
  hidePlatformAttribution: true,
  bankDetails: {
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: '',
  },
  upiId: '',
  qrCode: null,
  showBottomLogo: true,
  bottomLogo: null,
  paymentTerms: DEFAULT_PAYMENT_TERMS,
};
