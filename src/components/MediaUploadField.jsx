import React, { useRef } from 'react';
import { Trash2 } from 'lucide-react';

const pillBtnStyle = {
  background: '#5c479e',
  color: '#ffffff',
  border: 'none',
  borderRadius: 9999,
  padding: '10px 22px',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: '0 1px 4px rgba(92, 71, 158, 0.25)',
  transition: 'background 0.2s, transform 0.1s',
};

const removeMediaBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#dc2626',
  cursor: 'pointer',
  fontSize: '0.78rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 6px',
  borderRadius: 4,
};

const mediaPreviewBoxStyle = {
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  borderRadius: 8,
  padding: 10,
  marginBottom: 10,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

/**
 * One component for the "upload an image" row (logo, signature, stamp,
 * bottom logo, QR code): status line with optional Remove action, preview
 * box, choose button, and hidden file input.
 */
export default function MediaUploadField({
  field,
  src,
  label,
  alt,
  title,
  removeLabel = 'Remove',
  chooseLabel,
  replaceLabel,
  status,
  previewMaxHeight = 60,
  previewStyle,
  buttonStyle,
  onUpload,
  onRemove,
}) {
  const inputRef = useRef(null);

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: '0.95rem', color: '#1d1b20', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        {status != null && <span>{label}: {status}</span>}
        {src && (
          <button
            type="button"
            onClick={() => onRemove(field)}
            style={removeMediaBtnStyle}
            title={title || removeLabel}
          >
            <Trash2 size={13} /> {removeLabel}
          </button>
        )}
      </div>

      {src && (
        <div style={{ ...mediaPreviewBoxStyle, ...previewStyle }}>
          <img src={src} alt={alt} style={{ maxHeight: previewMaxHeight, maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      )}

      <button type="button" onClick={() => inputRef.current?.click()} style={{ ...pillBtnStyle, ...buttonStyle }}>
        {src ? (replaceLabel || chooseLabel) : chooseLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
        onChange={e => onUpload(field, e.target.files[0])}
      />
    </div>
  );
}
