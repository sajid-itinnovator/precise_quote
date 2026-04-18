import React, { createContext, useContext, useState, useEffect } from 'react';

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

// ─── Real clients from actual PDF quotations ───────────────────────────────
const SAMPLE_CLIENTS = [
  { id: 'c1', name: 'Almas Shaikh Mam', contact: '+91 9552527376', email: '', address: 'Alina Living NIBM Pune 411048' },
  { id: 'c2', name: 'Mr. Chandan Dhamale', contact: '+91 9850872330', email: '', address: '57 Midtown Wakad Pune' },
  { id: 'c3', name: 'Mr. Himakshi Vyas', contact: '+91 8619465377', email: '', address: 'Hinjewadi Pune' },
  { id: 'c4', name: 'Mr. Kiran', contact: '+91 9421687675', email: '', address: 'Manjari Pune' },
  { id: 'c5', name: 'Mr. Shaharuk Shaikh', contact: '+91 8805594497', email: '', address: 'Wagholi Pune' },
];

// ─── Real projects derived from PDF data ──────────────────────────────────
const SAMPLE_PROJECTS = [
  { id: 'p1', name: 'Almas Shaikh – 2 BHK', clientId: 'c1', amount: 1873960, status: 'APPROVED', tags: ['2BHK', 'NIBM'], image: null },
  { id: 'p2', name: 'Chandan Dhamale – 3 BHK', clientId: 'c2', amount: 1075000, status: 'APPROVED', tags: ['3BHK', 'Wakad'], image: null },
  { id: 'p3', name: 'Himakshi Vyas – 2 BHK', clientId: 'c3', amount: 958380, status: 'IN PROGRESS', tags: ['2BHK', 'Hinjewadi'], image: null },
  { id: 'p4', name: 'Kiran – 2 BHK', clientId: 'c4', amount: 728960, status: 'IN PROGRESS', tags: ['2BHK', 'Manjari'], image: null },
  { id: 'p5', name: 'Shaharuk Shaikh – Revised', clientId: 'c5', amount: 157530, status: 'DRAFT', tags: ['Revision', 'Wagholi'], image: null },
];

// ─── Real quotation data extracted from the 5 PDF files ───────────────────
const SAMPLE_QUOTATIONS = [
  // ── 1. Mr. Himakshi Vyas Sir – QT 1287 (complete data from reference images) ──
  {
    id: 'q1',
    quotationNo: '1287',
    date: '2026-04-13',
    clientId: 'c3',
    clientName: 'Mr. Himakshi Vyas Sir',
    clientContact: '+91 8619465377',
    clientAddress: 'Hinjewadi Pune',
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

  // ── 2. Mr. Kiran Sir – QT 1286 ──────────────────────────────────────────
  {
    id: 'q2',
    quotationNo: '1286',
    date: '2026-04-13',
    clientId: 'c4',
    clientName: 'Mr. Kiran Sir',
    clientContact: '+91 9421687675',
    clientAddress: 'Manjari Pune',
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

  // ── 3. Mr. Shaharuk Shaikh Sir – QT 1056 (Revised) ──────────────────────
  {
    id: 'q3',
    quotationNo: '1056',
    date: '2026-03-04',
    clientId: 'c5',
    clientName: 'Mr. Shaharuk Shaikh Sir',
    clientContact: '+91 8805594497',
    clientAddress: 'Wagholi Pune',
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

  // ── 4. Almas Shaikh Mam – QT 1125 ───────────────────────────────────────
  {
    id: 'q4',
    quotationNo: '1125',
    date: '2026-03-17',
    clientId: 'c1',
    clientName: 'Almas Shaikh Mam',
    clientContact: '+91 9552527376',
    clientAddress: 'Alina Living NIBM Pune 411048',
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

  // ── 5. Mr. Chandan Dhamale Sir – QT 1238 ────────────────────────────────
  {
    id: 'q5',
    quotationNo: '1238',
    date: '2026-03-17',
    clientId: 'c2',
    clientName: 'Mr. Chandan Dhamale Sir',
    clientContact: '+91 9850872330',
    clientAddress: '57 Midtown Wakad Pune',
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

export function AppProvider({ children }) {
  const [clients, setClients] = useState(() => loadFromStorage('vi_clients', SAMPLE_CLIENTS));
  const [projects, setProjects] = useState(() => loadFromStorage('vi_projects', SAMPLE_PROJECTS));
  const [quotations, setQuotations] = useState(() => loadFromStorage('vi_quotations', SAMPLE_QUOTATIONS));
  const [products, setProducts] = useState(() => loadFromStorage('vi_products', SAMPLE_PRODUCTS));
  const [materialSpec, setMaterialSpec] = useState(() => loadFromStorage('vi_materialspec', MATERIAL_SPEC_DEFAULT));
  const [nextQuoteNo, setNextQuoteNo] = useState(() => loadFromStorage('vi_nextquoteno', 1290));

  useEffect(() => { localStorage.setItem('vi_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('vi_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('vi_quotations', JSON.stringify(quotations)); }, [quotations]);
  useEffect(() => { localStorage.setItem('vi_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('vi_materialspec', JSON.stringify(materialSpec)); }, [materialSpec]);
  useEffect(() => { localStorage.setItem('vi_nextquoteno', JSON.stringify(nextQuoteNo)); }, [nextQuoteNo]);

  // Clients CRUD
  const addClient = (client) => { const c = { ...client, id: `c${Date.now()}` }; setClients(p => [...p, c]); return c; };
  const updateClient = (id, data) => setClients(p => p.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteClient = (id) => setClients(p => p.filter(c => c.id !== id));

  // Projects CRUD
  const addProject = (project) => { const p = { ...project, id: `p${Date.now()}` }; setProjects(prev => [...prev, p]); return p; };
  const updateProject = (id, data) => setProjects(p => p.map(pr => pr.id === id ? { ...pr, ...data } : pr));
  const deleteProject = (id) => setProjects(p => p.filter(pr => pr.id !== id));

  // Quotations CRUD
  const addQuotation = (quot) => {
    const q = { ...quot, id: `q${Date.now()}`, quotationNo: `QT-${nextQuoteNo}`, date: new Date().toISOString().slice(0, 10) };
    setQuotations(prev => [q, ...prev]);
    setNextQuoteNo(n => n + 1);
    return q;
  };
  const updateQuotation = (id, data) => setQuotations(p => p.map(q => q.id === id ? { ...q, ...data } : q));
  const deleteQuotation = (id) => setQuotations(p => p.filter(q => q.id !== id));

  // Products CRUD
  const addProduct = (prod) => { const p = { ...prod, id: `pr${Date.now()}` }; setProducts(prev => [...prev, p]); return p; };
  const updateProduct = (id, data) => setProducts(p => p.map(pr => pr.id === id ? { ...pr, ...data } : pr));
  const deleteProduct = (id) => setProducts(p => p.filter(pr => pr.id !== id));

  // Material spec
  const updateMaterialSpec = (spec) => setMaterialSpec(spec);

  const value = {
    clients, projects, quotations, products, materialSpec, nextQuoteNo,
    addClient, updateClient, deleteClient,
    addProject, updateProject, deleteProject,
    addQuotation, updateQuotation, deleteQuotation,
    addProduct, updateProduct, deleteProduct,
    updateMaterialSpec,
    ROOMS_DEFAULT,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
