/**
 * Quotation preset catalog — pure data, no React. The single source for the
 * room/item presets the Builder offers and the datalists it renders.
 */

export const GST_RATE = 0.18;

export const ROOM_PRESET_ITEMS = {
  'ENTRANCE': [
    'Safety Door With CNC Jali Europa Lock', 'Shoe Rack With Seating', 'Entrance Panelling', 'Foyer Unit', 'Entrance Wall Designing'
  ],
  'LIVING ROOM': [
    'TV Unit', 'Designer Sofa', 'Sofa Back Wall Design', 'Centre Table', 'A/c Pelmet', 'Bar Counter', 'Mandir Unit', 'Partition Work', 'Curtains Full Height', 'Other Wall Design'
  ],
  'LIVING BALCONY': [
    'Living Balcony PVC Ceiling', 'Living Balcony Pipe Cover', 'Living Balcony Sitout', 'Living Balcony Vertical Garden', 'Invisible Grill', 'French Door', 'Extra Storage', 'Ceiling Cloth Handing Road'
  ],
  'DINING AREA': [
    'Dining Table Marble Top', 'Foldable Dining Table', 'Dining Back Wall Design', 'Crockery Unit', 'Mandir Unit', 'Partition Work', 'PVC Ceiling'
  ],
  'KITCHEN': [
    'Modular Kitchen With Tandem Box', 'Loft Unit', 'Crockery Unit With Profile Light', 'Pantry Unit With Automatic Feting', 'Pantry Unit With manual Feting', 'Tall Unit', 'Foldable Table', 'Wicker Basket', 'Breakfast Counter', 'Partition Work', 'Dry Balcony PCV Ceiling', 'Dry Balcony Storage', 'Dry Balcony Window', 'Chimney'
  ],
  'BATHROOM': [
    'Bathroom PVC Ceiling', 'Bathroom Vanity + Mirror', 'Bathroom Basin Storage', 'Bathroom Glass Partition'
  ],
  'MASTER BEDROOM': [
    'Bed With Hydraulic Storage With Bed Back Cushion', 'Bed Side Table', 'Bed Side Table + Dressing Unit', 'Bed Back Wall Design', 'Wardrobe', 'Loft Unit', 'Dressing Unit With Mirror', 'Work Station', 'Work Station Over Head Storage', 'Work Station Over Head Shelf', 'Window Sitout', 'A/C Pelmet', 'Curtains Full Height'
  ],
  'KIDS BEDROOM': [
    'Bed With Hydraulic Storage With Bed Back Cushion', 'Bunk Bed', 'Murphy Bed', 'Bed Side Table', 'Bed Side Table + Dressing Unit', 'Bed Back Wall Design', 'Wardrobe', 'Loft Unit', 'Dressing Unit With Mirror', 'Study Table', 'Study Table Over Head Storage', 'Study Table Over Head Shelf', 'Window Sitout', 'A/C Pelmet', 'Curtains Full Height'
  ],
  'PARENT BEDROOM': [
    'Bed With Hydraulic Storage With Bed Back Cushion', 'Bunk Bed', 'Murphy Bed', 'Bed Side Table', 'Bed Side Table + Dressing Unit', 'Bed Back Wall Design', 'Wardrobe', 'Loft Unit', 'Dressing Unit With Mirror', 'Study Table', 'Study Table Over Head Storage', 'Study Table Over Head Shelf', 'Window Sitout', 'A/C Pelmet', 'Curtains Full Height'
  ],
  'CIVIL': [
    'Wall Demolish', 'Kitchen Counter Demolish', 'Kitchen Counter Top Change', 'Kitchen Counter Top extend', 'Tile Change'
  ],
  'OTHER WORK': [
    'False Ceiling Work', 'Electrical Work', 'Painting Work'
  ]
};

export const PRESET_ROOMS = [
  'ENTRANCE', 'LIVING ROOM', 'LIVING BALCONY', 'DINING AREA', 'KITCHEN',
  'BATHROOM', 'MASTER BEDROOM', 'KIDS BEDROOM', 'PARENT BEDROOM', 'CIVIL', 'OTHER WORK'
];

export const ALL_PRESET_ITEMS = Array.from(new Set(Object.values(ROOM_PRESET_ITEMS).flat()));
