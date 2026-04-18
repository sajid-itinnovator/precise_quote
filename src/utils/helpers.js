/**
 * Convert a number to Indian currency words
 * e.g. 958380 => "Nine Lac Fifty Eight Thousand Three Hundred and Eighty"
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n) {
  if (n >= 100) {
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + twoDigits(n % 100) : '');
  }
  return twoDigits(n);
}

export function numberToWords(amount) {
  const n = Math.floor(amount);
  if (n === 0) return 'Zero';

  const crore = Math.floor(n / 10000000);
  const lac = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  let result = '';
  if (crore) result += threeDigits(crore) + ' Crore ';
  if (lac) result += threeDigits(lac) + ' Lac ';
  if (thousand) result += threeDigits(thousand) + ' Thousand ';
  if (rest) result += threeDigits(rest);

  return result.trim();
}

export function formatIndianCurrency(amount) {
  const n = Math.floor(amount);
  return n.toLocaleString('en-IN');
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
