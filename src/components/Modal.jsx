import React, { useEffect, useRef, useCallback } from 'react';

// Shared across every mounted Modal instance — counts stacked open modals.
let scrollLockCount = 0;

/**
 * Accessible modal primitive — the single owner of overlay a11y behavior:
 * Escape-to-close, focus trap, aria-modal semantics, background scroll lock,
 * and focus restore to the trigger on close.
 *
 * Use <Modal> as the replacement for hand-rolled position:fixed overlays.
 * Content, styling, and header markup stay the caller's concern.
 */
export default function Modal({ onClose, children, maxWidth = 520, labelledBy, ariaLabel, zLevel = 500, className = 'modal', style, overlayStyle }) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    // A nested modal (e.g. brand editor inside the preview workspace) handles the
    // keystroke first (deeper in the bubble path); don't fight its wrap-around.
    if (e.defaultPrevented) return;
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
    // Reference-counted body scroll lock: with stacked modals, the deepest
    // unmount last must not resurrect 'hidden' after an outer modal already
    // restored 'visible' (each instance snapshots the same shared value).
    scrollLockCount += 1;
    document.body.style.overflow = 'hidden';
    // Initial focus: first focusable in the panel (focus is deliberately moved here).
    const focusables = panelRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    (focusables && focusables.length > 0 ? focusables[0] : panelRef.current)?.focus();
    return () => {
      scrollLockCount -= 1;
      if (scrollLockCount === 0) document.body.style.overflow = '';
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: zLevel, ...overlayStyle }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        className={className}
        style={{ maxWidth, ...style }}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
