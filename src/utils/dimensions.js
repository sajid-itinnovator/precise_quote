/**
 * Dimension/quantity parsing for quotation items. Pure functions — no React.
 * Extracted from Builder.jsx where the unit-sniffing logic was repeated 4×.
 */

/** Infer the measurement unit from a size string when the item has none set. */
export function detectUnit(sizeStr) {
  const s = String(sizeStr || '').toLowerCase();
  if (s.includes('point') || s.includes(' pt')) return 'point';
  if (s.includes('rft') || s.includes('running')) return 'rft';
  if (s.includes('inch') || s.includes('in"') || s.includes('"')) return 'inch';
  if (s.includes('meter') || s.includes('mtr') || s.includes(' m')) return 'meter';
  return 'sqft';
}

/** Parse 2D ("L X W") or 3D ("L X W X H") size strings → dimensions object or null. */
function parseDimensions(sizeStr) {
  if (!sizeStr) return null;
  const cleaned = String(sizeStr).replace(/['"“”]/g, '').replace(/\b(?:ft|feet)\b/gi, '').trim();

  const match3 = cleaned.match(/^([\d.]+)\s*[xX×*]\s*([\d.]+)\s*[xX×*]\s*([\d.]+)$/);
  if (match3) {
    const d1 = parseFloat(match3[1]) || 0;
    const d2 = parseFloat(match3[2]) || 0;
    const d3 = parseFloat(match3[3]) || 0;
    if (d1 > 0 && d2 > 0 && d3 > 0) {
      const total = Math.round(d1 * d2 * d3 * 100) / 100;
      return {
        count: 3,
        d1, d2, d3,
        l: d1, w: d2, h: d3,
        total,
        unit: 'cft',
        formatted: `${d1} × ${d2} × ${d3}`,
      };
    }
  }

  const match2 = cleaned.match(/^([\d.]+)\s*[xX×*]\s*([\d.]+)$/);
  if (match2) {
    const d1 = parseFloat(match2[1]) || 0;
    const d2 = parseFloat(match2[2]) || 0;
    if (d1 > 0 && d2 > 0) {
      const total = Math.round(d1 * d2 * 100) / 100;
      return {
        count: 2,
        d1, d2,
        l: d1, w: d2,
        total,
        unit: 'sqft',
        formatted: `${d1} × ${d2}`,
      };
    }
  }

  return null;
}

/** Parse an item into a displayable quantity: dims → formula, or single number → unit label. */
export function parseItemQuantity(item) {
  if (!item || !item.size) return null;
  const sizeStr = String(item.size).trim();
  const unit = item.unit || detectUnit(sizeStr);

  // 1. 3 dimensions: e.g. "1.5 X 2 X 2"
  const cleaned = sizeStr.replace(/['"“”]/g, '').replace(/\b(?:ft|feet)\b/gi, '').trim();
  const match3 = cleaned.match(/^([\d.]+)\s*[xX×*]\s*([\d.]+)\s*[xX×*]\s*([\d.]+)$/);
  if (match3) {
    const d1 = parseFloat(match3[1]) || 0;
    const d2 = parseFloat(match3[2]) || 0;
    const d3 = parseFloat(match3[3]) || 0;
    if (d1 > 0 && d2 > 0 && d3 > 0) {
      const total = Math.round(d1 * d2 * d3 * 100) / 100;
      return {
        qty: total,
        unit: 'cft',
        unitShort: 'cft',
        unitLabel: 'CFT',
        formatted: `${total} CFT`,
        formula: `${d1} × ${d2} × ${d3} = ${total} CFT`,
        is2D: false,
        is3D: true
      };
    }
  }

  // 2. 2 dimensions: e.g. "7 X 4.5"
  const match2 = cleaned.match(/^([\d.]+)\s*[xX×*]\s*([\d.]+)$/);
  if (match2) {
    const d1 = parseFloat(match2[1]) || 0;
    const d2 = parseFloat(match2[2]) || 0;
    if (d1 > 0 && d2 > 0) {
      const total = Math.round(d1 * d2 * 100) / 100;
      const unitLbl = unit === 'meter' ? 'Meter' : unit === 'inch' ? 'Inch' : 'Sq Ft';
      const unitSht = unit === 'meter' ? 'mtr' : unit === 'inch' ? 'inch' : 'sqft';
      return {
        qty: total,
        unit: unit === 'meter' ? 'meter' : unit === 'inch' ? 'inch' : 'sqft',
        unitShort: unitSht,
        unitLabel: unitLbl,
        formatted: `${total} ${unitLbl}`,
        formula: `${d1} × ${d2} = ${total} ${unitLbl}`,
        is2D: true
      };
    }
  }

  // 3. Single numeric quantity: e.g. "12", "12 Points", "25 Rft", "36 Inch", "3.5 Meter", "120 Sq Ft"
  const numMatch = sizeStr.match(/^([\d.]+)/);
  if (numMatch) {
    const qty = parseFloat(numMatch[1]) || 0;
    if (qty > 0) {
      const labels = {
        point: { unit: 'point', unitShort: 'point', unitLabel: 'Per Point', formatted: `${qty} Points` },
        rft: { unit: 'rft', unitShort: 'rft', unitLabel: 'Running Feet', formatted: `${qty} Rft` },
        inch: { unit: 'inch', unitShort: 'inch', unitLabel: 'Inches', formatted: `${qty} Inch` },
        meter: { unit: 'meter', unitShort: 'meter', unitLabel: 'Meters', formatted: `${qty} Meter` },
        sqft: { unit: 'sqft', unitShort: 'sqft', unitLabel: 'Sq Ft', formatted: `${qty} Sq Ft` },
      };
      const label = labels[unit] || labels.sqft;
      return { qty, ...label, is2D: false };
    }
  }

  return null;
}

/** Calculate SQFT / units for an item (non-sqft units contribute 0). */
export function calculateItemSqft(item) {
  if (!item) return 0;
  const unit = item.unit || detectUnit(item.size);
  if (unit === 'point' || unit === 'rft' || unit === 'inch' || unit === 'meter') {
    return 0;
  }

  if (item.sqft && !isNaN(Number(item.sqft))) return Number(item.sqft);

  const dims = parseDimensions(item.size);
  if (dims && dims.total > 0) {
    return dims.total;
  }

  const sizeStr = (item.size || '').trim();
  const directMatch = sizeStr.match(/^([\d.]+)\s*(?:sq\.?\s*ft|sft)$/i);
  if (directMatch) {
    return parseFloat(directMatch[1]) || 0;
  }

  const rateNum = parseFloat(item._rate) || 0;
  const amtNum = parseFloat(item.amount) || 0;
  if (rateNum > 0 && amtNum > 0) {
    return Math.round((amtNum / rateNum) * 100) / 100;
  }

  return 0;
}
