import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Accessible modal primitive — the single owner of overlay a11y behavior:
 * Escape-to-close, focus trap, aria-modal semantics, background scroll lock,
 * and focus restore to the trigger on close.
 *
 * Use <Modal> as the replacement for hand-rolled position:fixed overlays.
 * Content, styling, and header markup stay the caller's concern.
 */
export default function Modal({ onClose, children, maxWidth = 520, labelledBy, zLevel = 500, className = 'modal', style }) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    // Trap Tab within the panel: cycle among its focusable descendants.
    const focusables = panelRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Initial focus: first focusable in the panel (focus is deliberately moved here).
    const focusables = panelRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    (focusables && focusables.length > 0 ? focusables[0] : panelRef.current)?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: zLevel }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={className}
        style={{ maxWidth, ...style }}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
