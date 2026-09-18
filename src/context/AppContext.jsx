import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { getDomainContext } from '../utils/domainRouting';

const AppContext = createContext(null);

const ROOMS_DEFAULT = ['ENTRANCE', 'LIVING ROOM', 'DINING AREA', 'KITCHEN', 'MASTER BEDROOM', 'KIDS BEDROOM', 'BATHROOM', 'CIVIL', 'OTHER WORK'];

const MATERIAL_SPEC_DEFAULT = [
  { category: 'PLYWOOD', items: [
    { material: 'Furniture: Gurjan Plywood', brand: 'BWR ISI710 GRADE (18mm & 12mm)' },
    { material: 'Kitchen: Gurjan Plywood', brand: 'BWP ISI710 GRADE (18mm & 12mm)' },
    { material: 'Safety door: Gurjan', brand: 'BLOCK BOARD (35mm)' },
  ]},
  { category: 'HARDWARE', items: [
    { material: 'Hardware: Premium Quality', brand: 'ONYX' },
  ]},
  { category: 'LAMINATE', items: [
    { material: 'Laminate', brand: 'ADVANCE / REAL TOUCH' },
  ]},
  { category: 'FALSE CEILING', items: [
    { material: 'False Ceiling:', brand: 'GYPROC GYPSUM SHEET' },
    { material: 'Pvc Ceiling', brand: 'PVC BOARD' },
  ]},
  { category: 'WALL DESIGNING', items: [
    { material: 'Molding', brand: 'PDF / PVC' },
    { material: 'Wall Paper', brand: 'WASHABLE PREMIUM' },
  ]},
  { category: 'ELECTRICAL', items: [
    { material: 'Wire', brand: 'POLYCAB WIRES' },
    { material: 'Switches', brand: 'LEGRAND SWITCHES (Electrical point As Per Design)' },
  ]},
  { category: 'LIGHTS', items: [
    { material: 'Lights', brand: 'CROMPTON OR ORIENT\nPanel Light + Cob lights + Profile Light' },
  ]},
  { category: 'PAINTS', items: [
    { material: 'Paints:', brand: 'ASIAN\n(Luster with Wall Putty, Primer +2 Coat)' },
  ]},
];

// ─── Fictional demo records ────────────────────────────────────────────
// SECURITY: deliberately fake placeholder clients so new-tenant demo seeding
// works without shipping any real person's contact data in the client bundle
// or writing it to production Firestore.
const SAMPLE_CLIENTS = [
  { id: 'c1', name: 'Demo Client One', contact: '+91 9000000001', email: '', address: 'Sample Residency, Pune (Demo Data)' },
  { id: 'c2', name: 'Demo Client Two', contact: '+91 9000000002', email: '', address: 'Sample Heights, Wakad Pune (Demo Data)' },
  { id: 'c3', name: 'Demo Client Three', contact: '+91 9000000003', email: '', address: 'Sample Enclave, Hinjewadi Pune (Demo Data)' },
  { id: 'c4', name: 'Demo Client Four', contact: '+91 9000000004', email: '', address: 'Sample County, Manjari Pune (Demo Data)' },
  { id: 'c5', name: 'Demo Client Five', contact: '+91 9000000005', email: '', address: 'Sample Suites, Wagholi Pune (Demo Data)' },
];

// ─── Demo projects paired with the fictional clients above ──────────────
const SAMPLE_PROJECTS = [
  { id: 'p1', name: 'Demo Client One – 2 BHK', clientId: 'c1', amount: 1873960, status: 'APPROVED', tags: ['2BHK', 'Demo'], image: null },
  { id: 'p2', name: 'Demo Client Two – 3 BHK', clientId: 'c2', amount: 1075000, status: 'APPROVED', tags: ['3BHK', 'Demo'], image: null },
  { id: 'p3', name: 'Demo Client Three – 2 BHK', clientId: 'c3', amount: 958380, status: 'IN PROGRESS', tags: ['2BHK', 'Demo'], image: null },
  { id: 'p4', name: 'Demo Client Four – 2 BHK', clientId: 'c4', amount: 728960, status: 'IN PROGRESS', tags: ['2BHK', 'Demo'], image: null },
  { id: 'p5', name: 'Demo Client Five – Revised', clientId: 'c5', amount: 157530, status: 'DRAFT', tags: ['Revision', 'Demo'], image: null },
];

// ─── Demo quotation data (structure from reference PDFs, fictional clients) ─
const SAMPLE_QUOTATIONS = [
  // ── 1. Demo Client Three – QT 1287 (complete data from reference images) ──
  {
    id: 'q1',
    quotationNo: '1287',
    date: '2026-04-13',
    clientId: 'c3',
    clientName: 'Demo Client Three',
    clientContact: '+91 9000000003',
    clientAddress: 'Sample Enclave, Hinjewadi Pune (Demo Data)',
    projectTitle: '2 BHK INTERIOR DESIGN',
    status: 'IN PROGRESS',
    total: 958380,
    materialSpec: MATERIAL_SPEC_DEFAULT,
    rooms: [
      {
        name: 'ENTRANCE',
        items: [
          { particular: 'Safety Door With CNC Jali + Europa Lock', size: '7 X 4.5', amount: 35860 },
          { particular: 'Shoe Rack With Seating Cushion', size: '3 X 3', amount: 12600 },
          { particular: 'Entrance Paneling', size: '9 X 3 & 2 X 3', amount: 33450 },
        ],
      },
      {
        name: 'LIVING ROOM',
        items: [
          { particular: 'Tv Unit', size: '10 X 7', amount: 79500 },
          { particular: 'Designer Sofa', size: '3 + 2', amount: 56000 },
          { particular: 'Sofa Back Wall Designing', size: 'Moldings / Artifacts / Wall Paper', amount: 15620 },
          { particular: 'Mandir Unit With CNC Cutting', size: '2 X 7', amount: 22600 },
          { particular: 'Living Balcony Pvc Ceiling', size: '9 X 5.1', amount: 5600 },
        ],
      },
      {
        name: 'DINING AREA',
        items: [
          { particular: 'Dining Back wall Designing', size: 'Moldings / Artifacts / wall Paper', amount: 15620 },
        ],
      },
      {
        name: 'KITCHEN',
        items: [
          { particular: 'Modular Kitchen With Tandem Box', size: '14 X 2.8', amount: 68560 },
          { particular: 'Loft Storage', size: '16 X 2', amount: 43800 },
          { particular: 'Crockery With Profile Light', size: '14 X 2', amount: 38200 },
          { particular: 'Dry Balcony PVC Ceiling', size: '7.7 X 3', amount: 3520 },
          { particular: 'Common Bathroom Vanity', size: '2 X 2', amount: 4800 },
        ],
      },
      {
        name: 'MASTER BEDROOM',
        items: [
          { particular: 'Bed With Hydraulic Storage + Bed Back Cushion', size: '6 X 6.6', amount: 58400 },
          { particular: 'Bed Back Wall Designing', size: 'Moldings / Wallpaper', amount: 15620 },
          { particular: 'Bed Side Table', size: '1.5 X 2 X 2', amount: 12560 },
          { particular: 'Wardrobe', size: '5 X 7', amount: 55000 },
          { particular: 'Loft Storage', size: '5 X 2', amount: 14000 },
          { particular: 'Dressing Unit with Storage + Mirror', size: '2 X 7', amount: 21000 },
          { particular: 'Bathroom Vanity', size: '2 X 2', amount: 4800 },
          { particular: 'Balcony PVC Ceiling', size: '4.6 X 5.5', amount: 3290 },
        ],
      },
      {
        name: 'KIDS BEDROOM',
        items: [
          { particular: 'Bed With Hydraulic Storage + Bed Back Cushion', size: '5 X 6', amount: 45000 },
          { particular: 'Bed Back Wall Designing', size: 'Moldings / Wallpaper', amount: 15620 },
          { particular: 'Bed Side Table', size: '1.5 X 2 X 2', amount: 12560 },
          { particular: 'Wardrobe', size: '5 X 7', amount: 56000 },
          { particular: 'Loft Storage', size: '5 X 2', amount: 14000 },
          { particular: 'Study Table', size: '2 X 3', amount: 7200 },
          { particular: 'Study Table Overhead Storage with Profile Light', size: '3 X 3', amount: 12600 },
        ],
      },
      {
        name: 'OTHER WORK',
        items: [
          { particular: 'False Ceiling Work', size: 'Entire Flat', amount: 56000 },
          { particular: 'Electrical Work (As Per Design)', size: 'Entire Flat', amount: 60000 },
          { particular: 'Painting Work', size: 'Entire Flat', amount: 58000 },
        ],
      },
    ],
  },

  // ── 2. Demo Client Four – QT 1286 ───────────────────────────────────────
  {
    id: 'q2',
    quotationNo: '1286',
    date: '2026-04-13',
    clientId: 'c4',
    clientName: 'Demo Client Four',
    clientContact: '+91 9000000004',
    clientAddress: 'Sample County, Manjari Pune (Demo Data)',
    projectTitle: '2 BHK INTERIOR DESIGN',
    status: 'IN PROGRESS',
    total: 728960,
    materialSpec: MATERIAL_SPEC_DEFAULT,
    rooms: [
      {
        name: 'LIVING ROOM',
        items: [
          { particular: 'Tv Unit', size: '7 X 7', amount: 0 },
          { particular: 'Designer Sofa', size: '3 + 2', amount: 0 },
          { particular: 'Sofa Back Wall Designing', size: 'Moldings / Artifacts / Wall Paper', amount: 0 },
        ],
      },
      {
        name: 'DINING AREA',
        items: [
          { particular: 'Foldable Dining Table', size: '5 X 3', amount: 0 },
        ],
      },
      {
        name: 'KITCHEN',
        items: [
          { particular: 'Modular Kitchen With Tandem Box', size: '10 X 2.8', amount: 0 },
          { particular: 'Loft Storage', size: '10 X 2', amount: 0 },
          { particular: 'Crockery With Profile Light', size: '10 X 2', amount: 0 },
          { particular: 'Tall Unit', size: '2 X 7', amount: 0 },
        ],
      },
      {
        name: 'MASTER BEDROOM',
        items: [
          { particular: 'Bed With Hydraulic Storage + Bed Back Cushion', size: '6 X 6.6', amount: 0 },
          { particular: 'Bed Back Wall Designing', size: 'Moldings / Wallpaper', amount: 0 },
          { particular: 'Bed Side Table', size: '1.5 X 2 X 2', amount: 0 },
          { particular: 'Wardrobe', size: '7 X 7', amount: 0 },
          { particular: 'Loft Storage', size: '11 X 2', amount: 0 },
          { particular: 'Dressing Unit with Storage + Mirror', size: '2 X 7', amount: 0 },
          { particular: 'Work Station', size: '2 X 3', amount: 0 },
        ],
      },
      {
        name: 'OTHER WORK',
        items: [
          { particular: 'False Ceiling Work', size: 'Entire Flat', amount: 0 },
          { particular: 'Electrical Work (As Per Design)', size: 'Entire Flat', amount: 0 },
          { particular: 'Painting Work', size: 'Entire Flat', amount: 0 },
        ],
      },
    ],
  },

  // ── 3. Demo Client Five – QT 1056 (Revised) ─────────────────────────────
  {
    id: 'q3',
    quotationNo: '1056',
    date: '2026-03-04',
    clientId: 'c5',
    clientName: 'Demo Client Five',
    clientContact: '+91 9000000005',
    clientAddress: 'Sample Suites, Wagholi Pune (Demo Data)',
    projectTitle: 'REVISED QUOTATION',
    status: 'DRAFT',
    total: 157530,
    materialSpec: MATERIAL_SPEC_DEFAULT,
    rooms: [
      {
        name: 'BEDROOMS',
        items: [
          { particular: 'Master Bedroom Bed Back Paneling', size: '7 X 7', amount: 41100 },
          { particular: 'Master Bedroom Study Table', size: '2 X 3', amount: 6380 },
          { particular: 'Kids Bedroom Bed Back Paneling', size: '8 X 7', amount: 46400 },
        ],
      },
      {
        name: 'LIVING ROOM',
        items: [
          { particular: 'TV Unit Storage', size: '1 X 7', amount: 9400 },
          { particular: 'TV Unit Deco', size: '2 X 8', amount: 21600 },
          { particular: 'Sofa Back Wall Design', size: '11 X 7', amount: 32650 },
        ],
      },
      {
        name: 'KITCHEN',
        items: [
          { particular: 'Kitchen Tall Unit With Rolling Shutter', size: '5 X 2', amount: 0 },
          { particular: 'Kitchen Wicker Basket', size: '2', amount: 0 },
        ],
      },
    ],
  },

  // ── 4. Demo Client One – QT 1125 ────────────────────────────────────────
  {
    id: 'q4',
    quotationNo: '1125',
    date: '2026-03-17',
    clientId: 'c1',
    clientName: 'Demo Client One',
    clientContact: '+91 9000000001',
    clientAddress: 'Sample Residency, Pune (Demo Data)',
    projectTitle: '2 BHK INTERIOR DESIGN',
    status: 'APPROVED',
    total: 1873960,
    materialSpec: MATERIAL_SPEC_DEFAULT,
    rooms: [
      {
        name: 'ENTRANCE',
        items: [
          { particular: 'Safety Door With CNC Jali', size: '7 X 4.5', amount: 35860 },
          { particular: 'Name Plate', size: '1 X 1', amount: 3500 },
          { particular: 'Shoe Rack With Seating Cushion', size: '3 X 3', amount: 12600 },
          { particular: 'Foyer Unit', size: '3 X 7', amount: 25200 },
        ],
      },
      {
        name: 'LIVING ROOM',
        items: [
          { particular: 'TV Unit', size: '10 X 7', amount: 79500 },
          { particular: '6-Seater Sofa', size: '3 + 2 + 1', amount: 67200 },
          { particular: 'Center Table', size: '4 X 2.5', amount: 18000 },
          { particular: 'Sofa Back Wall Designing', size: 'Moldings / Artifacts / Wall Paper', amount: 15620 },
        ],
      },
      {
        name: 'KITCHEN',
        items: [
          { particular: 'Modular Kitchen With Tandem Box', size: '13 X 2.8 + 7 X 2.8', amount: 117600 },
          { particular: 'Loft Storage', size: '14 X 2', amount: 38200 },
          { particular: 'Tall Unit With Pantry', size: '2 X 7', amount: 25200 },
          { particular: 'Overhead Storage', size: '7 X 2', amount: 19100 },
        ],
      },
      {
        name: 'MASTER BEDROOM',
        items: [
          { particular: 'Bed With Hydraulic Storage + Bed Back Paneling', size: '6 X 6.6', amount: 72000 },
          { particular: 'Bed Back Wall Designing', size: 'Moldings / Wallpaper', amount: 15620 },
          { particular: 'Wardrobe', size: '5 X 7', amount: 55000 },
          { particular: 'Dressing Unit with Storage + Mirror', size: '2 X 7', amount: 21000 },
          { particular: 'Loft Storage', size: '5 X 2', amount: 14000 },
        ],
      },
      {
        name: 'KIDS BEDROOM',
        items: [
          { particular: 'Sofa Cum Bed With Storage', size: '6 X 3.5', amount: 48000 },
          { particular: 'Wardrobe', size: '5 X 7', amount: 56000 },
          { particular: 'Study Table With Overhead Storage', size: '3 X 3', amount: 21000 },
          { particular: 'Bed Back Wall Designing', size: 'Moldings / Wallpaper', amount: 15620 },
        ],
      },
      {
        name: 'OTHER WORK',
        items: [
          { particular: 'False Ceiling Work', size: 'Entire Flat', amount: 85000 },
          { particular: 'Electrical Work – Alexa Enabled', size: 'Entire Flat', amount: 75000 },
          { particular: 'Painting Work', size: 'Entire Flat', amount: 65000 },
          { particular: 'Civil Work (Kitchen & Bathroom Renovation)', size: 'Entire Flat', amount: 80000 },
        ],
      },
    ],
  },

  // ── 5. Demo Client Two – QT 1238 ────────────────────────────────────────
  {
    id: 'q5',
    quotationNo: '1238',
    date: '2026-03-17',
    clientId: 'c2',
    clientName: 'Demo Client Two',
    clientContact: '+91 9000000002',
    clientAddress: 'Sample Heights, Wakad Pune (Demo Data)',
    projectTitle: '3 BHK INTERIOR DESIGN',
    status: 'APPROVED',
    total: 1075000,
    materialSpec: MATERIAL_SPEC_DEFAULT,
    rooms: [
      {
        name: 'ENTRANCE',
        items: [
          { particular: 'Safety Door With CNC Jali', size: '7 X 4.5', amount: 35860 },
          { particular: 'Shoe Rack With Seating Cushion', size: '3 X 3', amount: 12600 },
        ],
      },
      {
        name: 'LIVING ROOM',
        items: [
          { particular: 'TV Unit', size: '10 X 7', amount: 79500 },
          { particular: '6-Seater Designer Sofa', size: '3 + 2 + 1', amount: 67200 },
          { particular: 'Molding / Wall Designing', size: 'Moldings / Artifacts / Wall Paper', amount: 15620 },
        ],
      },
      {
        name: 'KITCHEN',
        items: [
          { particular: 'Modular Kitchen With Tandem Box', size: '10 X 2.8 + 7 X 2.8', amount: 95200 },
          { particular: 'Loft Storage', size: '12 X 2', amount: 32800 },
          { particular: 'Overhead Storage', size: '7 X 2', amount: 19100 },
        ],
      },
      {
        name: 'MASTER BEDROOM',
        items: [
          { particular: 'Bed With Hydraulic Storage', size: '6 X 6.6', amount: 58400 },
          { particular: 'Wardrobe', size: '5 X 7', amount: 55000 },
          { particular: 'Dressing Unit with Storage + Mirror', size: '2 X 7', amount: 21000 },
          { particular: 'Bed Back Wall Designing', size: 'Moldings / Wallpaper', amount: 15620 },
        ],
      },
      {
        name: 'KIDS BEDROOM',
        items: [
          { particular: 'Bed With Hydraulic Storage', size: '5 X 6', amount: 45000 },
          { particular: 'Wardrobe', size: '4 X 7', amount: 44800 },
          { particular: 'Study Table with Overhead Storage', size: '3 X 3', amount: 21000 },
        ],
      },
      {
        name: 'GUEST BEDROOM',
        items: [
          { particular: 'Wardrobe', size: '4 X 7', amount: 44800 },
          { particular: 'Loft Storage', size: '4 X 2', amount: 10920 },
        ],
      },
      {
        name: 'OTHER WORK',
        items: [
          { particular: 'False Ceiling Work', size: 'Entire Flat', amount: 75000 },
          { particular: 'Electrical Work (As Per Design)', size: 'Entire Flat', amount: 65000 },
          { particular: 'Painting Work', size: 'Entire Flat', amount: 58000 },
        ],
      },
    ],
  },
];

// ─── Products/Materials library ───────────────────────────────────────────
const SAMPLE_PRODUCTS = [
  { id: 'pr1', name: 'Safety Door With CNC Jali', unit: 'unit', defaultRate: 35860 },
  { id: 'pr2', name: 'Shoe Rack With Seating Cushion', unit: 'unit', defaultRate: 12600 },
  { id: 'pr3', name: 'Modular Kitchen With Tandem Box', unit: 'sqft', defaultRate: 3500 },
  { id: 'pr4', name: 'Bed With Hydraulic Storage', unit: 'unit', defaultRate: 58400 },
  { id: 'pr5', name: 'Wardrobe', unit: 'sqft', defaultRate: 1100 },
  { id: 'pr6', name: 'Loft Storage', unit: 'sqft', defaultRate: 1370 },
  { id: 'pr7', name: 'TV Unit', unit: 'sqft', defaultRate: 1650 },
  { id: 'pr8', name: 'Wall Designing / Moldings', unit: 'lot', defaultRate: 15620 },
  { id: 'pr9', name: 'False Ceiling Work', unit: 'lot', defaultRate: 56000 },
  { id: 'pr10', name: 'Electrical Work (As Per Design)', unit: 'lot', defaultRate: 60000 },
  { id: 'pr11', name: 'Painting Work', unit: 'lot', defaultRate: 58000 },
  { id: 'pr12', name: 'Study Table With Overhead Storage', unit: 'unit', defaultRate: 21000 },
  { id: 'pr13', name: 'Dressing Unit With Mirror', unit: 'unit', defaultRate: 21000 },
  { id: 'pr14', name: 'PVC Ceiling', unit: 'sqft', defaultRate: 120 },
  { id: 'pr15', name: 'Bathroom Vanity', unit: 'unit', defaultRate: 4800 },
  // ─── Bathroom items ───────────────────────────────────────────────────────
  { id: 'pr16', name: 'Bathroom Wall Tiles', unit: 'sqft', defaultRate: 85 },
  { id: 'pr17', name: 'Bathroom Floor Tiles', unit: 'sqft', defaultRate: 75 },
  { id: 'pr18', name: 'Bathroom Fitting (EWC, Basin, Tap Set)', unit: 'lot', defaultRate: 35000 },
  { id: 'pr19', name: 'Shower Partition (Glass)', unit: 'unit', defaultRate: 18000 },
  { id: 'pr20', name: 'Exhaust Fan', unit: 'unit', defaultRate: 2500 },
  { id: 'pr21', name: 'Geyser Point & Fitting', unit: 'unit', defaultRate: 4500 },
  { id: 'pr22', name: 'Mirror With Light', unit: 'unit', defaultRate: 6500 },
  { id: 'pr23', name: 'Bathroom Accessories Set (Towel Rod, Soap Dish, etc.)', unit: 'set', defaultRate: 5500 },
  // ─── Civil items ──────────────────────────────────────────────────────────
  { id: 'pr24', name: 'Civil Work (Kitchen & Bathroom Renovation)', unit: 'lot', defaultRate: 80000 },
  { id: 'pr25', name: 'Tile Demolition & Disposal', unit: 'sqft', defaultRate: 35 },
  { id: 'pr26', name: 'Wall Hacking & Plastering', unit: 'sqft', defaultRate: 60 },
  { id: 'pr27', name: 'Waterproofing (Bathroom/Balcony)', unit: 'sqft', defaultRate: 95 },
  { id: 'pr28', name: 'Tile Laying (Floor)', unit: 'sqft', defaultRate: 55 },
  { id: 'pr29', name: 'Tile Laying (Wall)', unit: 'sqft', defaultRate: 65 },
  { id: 'pr30', name: 'Plumbing (Pipe Shifting / New Points)', unit: 'point', defaultRate: 3500 },
  { id: 'pr31', name: 'Granite Counter Top', unit: 'sqft', defaultRate: 280 },
  { id: 'pr32', name: 'Door Frame & Chowkhat Fixing', unit: 'unit', defaultRate: 4200 },
];

// Increment this version whenever default data changes — forces a localStorage reset
const DATA_VERSION = 'v3_bathroom_civil';

function loadFromStorage(key, fallback) {
  // Version check: wipe stale data if version mismatch
  const storedVersion = localStorage.getItem('vi_data_version');
  if (storedVersion !== DATA_VERSION) {
    // Clear all vi_ keys
    Object.keys(localStorage).filter(k => k.startsWith('vi_')).forEach(k => localStorage.removeItem(k));
    localStorage.setItem('vi_data_version', DATA_VERSION);
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

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
];

export const VISTARA_SAMPLE_PROFILE = {
  companyName: "VISTARA INTERIOR'S",
  tagline: 'Designing Dreams Creating Reality......',
  officeAddress: 'Office No.01, Ambekar Hotel Chowk, Undri Pisoli, Pune-411060',
  phone: '+91 7720097476 / 8482946451',
  email: 'teamvistarainteriors@gmail.com',
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

export function AppProvider({ children }) {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [products, setProducts] = useState([]);
  const [materialSpec, setMaterialSpec] = useState(MATERIAL_SPEC_DEFAULT);
  const [nextQuoteNo, setNextQuoteNo] = useState(1290);
  const [tenantLogo, setTenantLogo] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(DEFAULT_COMPANY_PROFILE);
  const [subscription, setSubscription] = useState({ 
    plan: 'trial', 
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    totalCredits: 50,
    spentCredits: 0,
    balanceCredits: 50
  });
  const [loading, setLoading] = useState(true);

  // Load from Firebase
  useEffect(() => {
    if (authLoading || !currentUser || !userProfile) {
      if (!authLoading && !currentUser) setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const isPrivate = userProfile.dataAccess === 'private';
        const tenantId = userProfile.tenantId;

        if (!tenantId) {
          console.error("User profile has no tenantId! Cannot load data.");
          setLoading(false);
          return;
        }
        
        const isVistara = (userProfile.companyName && userProfile.companyName.toLowerCase().includes('vistara')) ||
                          (userProfile.tenantName && userProfile.tenantName.toLowerCase().includes('vistara')) ||
                          (tenantId && tenantId.toLowerCase().includes('vistara'));

        const initialBaseProfile = isVistara ? VISTARA_SAMPLE_PROFILE : {
          ...DEFAULT_COMPANY_PROFILE,
          companyName: userProfile.tenantName || userProfile.companyName || '',
        };

        let clientsQ = query(collection(db, 'clients'), where('tenantId', '==', tenantId));
        const clientsSnap = await getDocs(clientsQ);
        let loadedClients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (isPrivate) loadedClients = loadedClients.filter(c => c.createdBy === currentUser.uid);
        
        // If DB is completely empty for this tenant, seed it with initial data
        if (loadedClients.length === 0 && !isPrivate) {
          console.log("Seeding database with initial data for new tenant...");
          
          await setDoc(doc(db, 'config', `${tenantId}_materialSpec`), { data: MATERIAL_SPEC_DEFAULT, tenantId });
          await setDoc(doc(db, 'config', `${tenantId}_nextQuoteNo`), { value: 1290, tenantId });
          await setDoc(doc(db, 'config', `${tenantId}_tenantLogo`), { data: null, tenantId });
          await setDoc(doc(db, 'config', `${tenantId}_companyProfile`), { data: initialBaseProfile, tenantId });
          setCompanyProfile(initialBaseProfile);

          const trialDate = new Date();
          trialDate.setDate(trialDate.getDate() + 30);
          const initialTotal = 50;
          const initialSpent = isVistara ? SAMPLE_QUOTATIONS.length : 0;
          const initialBalance = Math.max(0, initialTotal - initialSpent);
          await setDoc(doc(db, 'config', `${tenantId}_subscription`), { 
            plan: 'trial', 
            trialEndsAt: trialDate.toISOString(), 
            tenantId,
            totalCredits: initialTotal,
            spentCredits: initialSpent,
            balanceCredits: initialBalance
          });
          setSubscription({
            plan: 'trial',
            trialEndsAt: trialDate.toISOString(),
            totalCredits: initialTotal,
            spentCredits: initialSpent,
            balanceCredits: initialBalance
          });

          for (const pr of SAMPLE_PRODUCTS) await setDoc(doc(db, 'products', `${tenantId}_${pr.id}`), { ...pr, tenantId });
          setProducts(SAMPLE_PRODUCTS.map(pr => ({...pr, id: `${tenantId}_${pr.id}`, tenantId})));

          // Only seed Vistara demo clients/projects for Vistara accounts
          if (isVistara) {
            for (const c of SAMPLE_CLIENTS) await setDoc(doc(db, 'clients', `${tenantId}_${c.id}`), { ...c, tenantId, createdBy: currentUser.uid });
            for (const p of SAMPLE_PROJECTS) await setDoc(doc(db, 'projects', `${tenantId}_${p.id}`), { ...p, clientId: `${tenantId}_${p.clientId}`, tenantId, createdBy: currentUser.uid });
            for (const q of SAMPLE_QUOTATIONS) await setDoc(doc(db, 'quotations', `${tenantId}_${q.id}`), { ...q, clientId: `${tenantId}_${q.clientId}`, tenantId, createdBy: currentUser.uid });

            setClients(SAMPLE_CLIENTS.map(c => ({...c, id: `${tenantId}_${c.id}`, tenantId})));
            setProjects(SAMPLE_PROJECTS.map(p => ({...p, id: `${tenantId}_${p.id}`, clientId: `${tenantId}_${p.clientId}`, tenantId})));
            setQuotations(SAMPLE_QUOTATIONS.map(q => ({...q, id: `${tenantId}_${q.id}`, clientId: `${tenantId}_${q.clientId}`, tenantId})));
          } else {
            setClients([]);
            setProjects([]);
            setQuotations([]);
          }
        } else {
          setClients(loadedClients);
          
          let projectsQ = query(collection(db, 'projects'), where('tenantId', '==', tenantId));
          const projectsSnap = await getDocs(projectsQ);
          let loadedProjects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (isPrivate) loadedProjects = loadedProjects.filter(p => p.createdBy === currentUser.uid);
          setProjects(loadedProjects);
          
          let quotesQ = query(collection(db, 'quotations'), where('tenantId', '==', tenantId));
          const quotationsSnap = await getDocs(quotesQ);
          let loadedQuotes = quotationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (isPrivate) loadedQuotes = loadedQuotes.filter(q => q.createdBy === currentUser.uid);
          setQuotations(loadedQuotes);
          
          let productsQ = query(collection(db, 'products'), where('tenantId', '==', tenantId));
          const productsSnap = await getDocs(productsQ);
          setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          
          let savedNextNo = null;
          let savedProfile = null;
          const specSnap = await getDocs(query(collection(db, 'config'), where('tenantId', '==', tenantId)));
          specSnap.docs.forEach(doc => {
            if (doc.id.includes('materialSpec')) setMaterialSpec(doc.data().data);
            if (doc.id.includes('nextQuoteNo')) savedNextNo = doc.data().value;
            if (doc.id.includes('tenantLogo')) {
              setTenantLogo(doc.data().data);
            }
            if (doc.id.includes('companyProfile')) {
              savedProfile = doc.data().data;
            }
            if (doc.id.includes('subscription')) {
              const subData = doc.data();
              const isPro = subData.plan === 'pro' || subData.plan === 'enterprise';
              const defaultTotal = isPro ? 500 : 50;
              const totalCreds = subData.totalCredits !== undefined ? Number(subData.totalCredits) : defaultTotal;
              const spentCreds = subData.spentCredits !== undefined ? Number(subData.spentCredits) : loadedQuotes.length;
              const balanceCreds = subData.balanceCredits !== undefined ? Number(subData.balanceCredits) : Math.max(0, totalCreds - spentCreds);

              setSubscription({ 
                plan: subData.plan || 'trial', 
                quoteLimit: subData.quoteLimit,
                trialEndsAt: subData.trialEndsAt,
                totalCredits: totalCreds,
                spentCredits: spentCreds,
                balanceCredits: balanceCreds,
                activeUntil: subData.activeUntil
              });
            }
          });

          const resolvedProfile = savedProfile 
            ? { ...initialBaseProfile, ...savedProfile } 
            : initialBaseProfile;
          setCompanyProfile(resolvedProfile);
          if (resolvedProfile.logo) {
            setTenantLogo(resolvedProfile.logo);
          }

          const effectiveNextNo = calculateNextQuoteNo(loadedQuotes, savedNextNo || 1290);
          setNextQuoteNo(effectiveNextNo);
        }
      } catch (error) {
        console.error("Failed to load Firebase data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser, userProfile, authLoading]);

  // Sync materialSpec and nextQuoteNo to Firebase when they change
  useEffect(() => {
    if (loading || !userProfile?.tenantId) return;
    const saveSpec = async () => {
      try { await setDoc(doc(db, 'config', `${userProfile.tenantId}_materialSpec`), { data: materialSpec, tenantId: userProfile.tenantId }); } 
      catch (e) { console.error("Error saving material specs", e); }
    };
    saveSpec();
  }, [materialSpec, loading, userProfile]);

  useEffect(() => {
    if (loading || !userProfile?.tenantId) return;
    const saveNextNo = async () => {
      try { await setDoc(doc(db, 'config', `${userProfile.tenantId}_nextQuoteNo`), { value: nextQuoteNo, tenantId: userProfile.tenantId }); } 
      catch (e) { console.error("Error saving next quote no", e); }
    };
    saveNextNo();
  }, [nextQuoteNo, loading, userProfile]);

  // Dynamic White Label Theme Injection
  useEffect(() => {
    const domain = getDomainContext();
    const isVistaraDomain = domain.tenantSubdomain && domain.tenantSubdomain.includes('vistara');

    // Determine effective profile or subdomain defaults
    const effectiveProfile = companyProfile || (isVistaraDomain ? VISTARA_SAMPLE_PROFILE : DEFAULT_COMPANY_PROFILE);

    // Apply primary brand color if configured
    const primary = effectiveProfile?.brandColor || '#1a56ff';
    const dark = effectiveProfile?.brandColorDark || '#1240cc';
    const light = effectiveProfile?.brandColorLight || '#e8eeff';

    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--primary-dark', dark);
    document.documentElement.style.setProperty('--primary-light', light);

    // Helper: Convert hex to r,g,b numbers for CSS rgba() compatibility
    const cleanHex = primary.replace('#', '').trim();
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
      }
    }

    // Dynamic browser title
    const tenantBrand = effectiveProfile?.companyName || userProfile?.tenantName || (isVistaraDomain ? "VISTARA INTERIOR'S" : '');
    if (tenantBrand && tenantBrand.trim()) {
      const customSubtitle = effectiveProfile?.workspaceSubtitle || 'Quotation & Estimation Studio';
      document.title = `${tenantBrand} – ${customSubtitle}`;
    }
  }, [companyProfile, userProfile]);

  useEffect(() => {
    if (loading || !userProfile?.tenantId || tenantLogo === null) return;
    const saveLogo = async () => {
      try { await setDoc(doc(db, 'config', `${userProfile.tenantId}_tenantLogo`), { data: tenantLogo, tenantId: userProfile.tenantId }); } 
      catch (e) { console.error("Error saving tenant logo", e); }
    };
    saveLogo();
  }, [tenantLogo, loading, userProfile]);

  // Clients CRUD
  const addClient = async (client) => {
    const docRef = await addDoc(collection(db, 'clients'), { ...client, createdBy: currentUser?.uid, tenantId: userProfile?.tenantId });
    setClients(prev => [...prev, { ...client, id: docRef.id, createdBy: currentUser?.uid, tenantId: userProfile?.tenantId }]);
    return docRef.id;
  };
  const updateClient = async (id, data) => {
    await updateDoc(doc(db, 'clients', id), data);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };
  const deleteClient = async (id) => {
    await deleteDoc(doc(db, 'clients', id));
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Projects CRUD
  const addProject = async (project) => {
    const docRef = await addDoc(collection(db, 'projects'), { ...project, createdBy: currentUser?.uid, tenantId: userProfile?.tenantId });
    setProjects(prev => [...prev, { ...project, id: docRef.id, createdBy: currentUser?.uid, tenantId: userProfile?.tenantId }]);
    return docRef.id;
  };
  const updateProject = async (id, data) => {
    await updateDoc(doc(db, 'projects', id), data);
    setProjects(p => p.map(pr => pr.id === id ? { ...pr, ...data } : pr));
  };
  const deleteProject = async (id) => {
    await deleteDoc(doc(db, 'projects', id));
    setProjects(p => p.filter(pr => pr.id !== id));
  };

  // Quotations CRUD
  const addQuotation = async (quotation) => {
    if (subscription.plan === 'trial') {
      if (new Date() > new Date(subscription.trialEndsAt)) {
        throw new Error('SUBSCRIPTION_LIMIT_REACHED');
      }
    } else if (subscription.plan !== 'enterprise' && subscription.plan !== 'pro') {
      if (subscription.quoteLimit && quotations.length >= subscription.quoteLimit) {
        throw new Error('SUBSCRIPTION_LIMIT_REACHED');
      }
    }

    const calculatedNext = calculateNextQuoteNo(quotations, nextQuoteNo);
    const assignedNo = (quotation.quotationNo && quotation.quotationNo !== '1290' && quotation.quotationNo.trim() !== '')
      ? quotation.quotationNo.trim()
      : String(calculatedNext);

    const nowIso = new Date().toISOString();
    const qWithDetails = { 
      ...quotation, 
      quotationNo: assignedNo,
      status: quotation.status || 'DRAFT',
      date: quotation.date || nowIso.slice(0, 10),
      createdAt: quotation.createdAt || nowIso,
      createdBy: currentUser?.uid,
      createdByName: userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Staff',
      tenantId: userProfile?.tenantId
    };
    const docRef = await addDoc(collection(db, 'quotations'), qWithDetails);
    
    const assignedDigits = assignedNo.match(/\d+/g);
    const assignedVal = assignedDigits ? parseInt(assignedDigits[assignedDigits.length - 1], 10) : calculatedNext;
    const newNextNo = Math.max(calculatedNext, (isNaN(assignedVal) ? calculatedNext : assignedVal)) + 1;
    await setDoc(doc(db, 'config', `${userProfile.tenantId}_nextQuoteNo`), { value: newNextNo, tenantId: userProfile.tenantId });
    
    // Update credit consumption
    try {
      const currentSpent = subscription.spentCredits !== undefined ? subscription.spentCredits : quotations.length;
      const currentTotal = subscription.totalCredits !== undefined ? subscription.totalCredits : 50;
      const newSpent = currentSpent + 1;
      const newBalance = Math.max(0, currentTotal - newSpent);
      const updatedSub = {
        ...subscription,
        spentCredits: newSpent,
        balanceCredits: newBalance,
        totalCredits: currentTotal
      };
      setSubscription(updatedSub);
      await setDoc(doc(db, 'config', `${userProfile.tenantId}_subscription`), {
        ...updatedSub,
        tenantId: userProfile.tenantId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (credErr) {
      console.warn("Could not sync credit deduction:", credErr);
    }

    setQuotations(prev => [...prev, { ...qWithDetails, id: docRef.id }]);
    setNextQuoteNo(newNextNo);
    return docRef.id;
  };
  const updateQuotation = async (id, data) => {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, 'quotations', id), updateData);
    setQuotations(p => p.map(q => q.id === id ? { ...q, ...updateData } : q));
  };
  const deleteQuotation = async (id) => {
    await deleteDoc(doc(db, 'quotations', id));
    setQuotations(p => p.filter(q => q.id !== id));
  };

  // Products CRUD
  const addProduct = async (prod) => { 
    const pData = { ...prod };
    const ref = await addDoc(collection(db, 'products'), pData);
    const p = { id: ref.id, ...pData };
    setProducts(prev => [...prev, p]); 
    return p; 
  };
  const updateProduct = async (id, data) => {
    await updateDoc(doc(db, 'products', id), data);
    setProducts(p => p.map(pr => pr.id === id ? { ...pr, ...data } : pr));
  };
  const deleteProduct = async (id) => {
    await deleteDoc(doc(db, 'products', id));
    setProducts(p => p.filter(pr => pr.id !== id));
  };

  // Material spec
  const updateMaterialSpec = (spec) => setMaterialSpec(spec);

  // Company Profile
  const updateCompanyProfile = async (profileData) => {
    if (!userProfile?.tenantId) return false;
    try {
      const updated = { ...profileData, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'config', `${userProfile.tenantId}_companyProfile`), {
        data: updated,
        tenantId: userProfile.tenantId
      });
      setCompanyProfile(updated);
      if (updated.logo !== undefined) {
        setTenantLogo(updated.logo);
        await setDoc(doc(db, 'config', `${userProfile.tenantId}_tenantLogo`), { data: updated.logo, tenantId: userProfile.tenantId });
      }
      return true;
    } catch (err) {
      console.error("Error saving company profile:", err);
      throw err;
    }
  };

  const value = {
    clients, projects, quotations, products, materialSpec, nextQuoteNo, tenantLogo, setTenantLogo,
    companyProfile, updateCompanyProfile, DEFAULT_COMPANY_PROFILE, VISTARA_SAMPLE_PROFILE,
    DEFAULT_PAYMENT_TERMS, PAYMENT_TERMS_PRESETS, BRAND_COLOR_PRESETS,
    subscription, loading,
    addClient, updateClient, deleteClient,
    addProject, updateProject, deleteProject,
    addQuotation, updateQuotation, deleteQuotation,
    addProduct, updateProduct, deleteProduct,
    updateMaterialSpec,
    calculateNextQuoteNo,
    ROOMS_DEFAULT,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
