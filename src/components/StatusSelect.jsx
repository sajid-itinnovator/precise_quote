import React from 'react';
import { STATUS_OPTIONS, statusBackground } from '../constants/invoiceStatus';

/**
 * The single status selector for invoices — used by the preview toolbar and
 * the mobile More sheet. Options and colors come from constants/invoiceStatus.
 */
export default function StatusSelect({ value, onChange, className, style, ariaLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      style={{ background: statusBackground(value), ...style }}
      aria-label={ariaLabel}
    >
      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
