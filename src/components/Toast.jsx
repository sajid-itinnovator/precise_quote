import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

/* eslint-disable react-refresh/only-export-components -- provider modules export the useToast hook alongside the provider by convention */

/**
 * Branded toast notifications — the single replacement for native alert().
 * Announced to assistive tech via role=status/alert on each toast.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Saved!');
 *   toast.error('Something failed', { action: { label: 'Upgrade', onClick: () => navigate('/admin') } });
 *   toast.info('Heads up');
 */

const ToastContext = createContext(null);

const VARIANT_META = {
  success: { icon: CheckCircle2, className: 'toast-success', role: 'status' },
  error: { icon: AlertTriangle, className: 'toast-error', role: 'alert' },
  info: { icon: Info, className: 'toast-info', role: 'status' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const show = useCallback((message, { variant = 'info', action, duration } = {}) => {
    const id = ++idCounter.current;
    const life = duration ?? (variant === 'error' ? 7000 : 4500);
    setToasts(ts => [...ts.slice(-2), { id, message, variant, action }]);
    timersRef.current.set(id, setTimeout(() => dismiss(id), life));
    return id;
  }, [dismiss]);

  useEffect(() => () => { for (const t of timersRef.current.values()) clearTimeout(t); }, []);

  const api = { show, success: (m, o) => show(m, { ...o, variant: 'success' }), error: (m, o) => show(m, { ...o, variant: 'error' }), info: (m, o) => show(m, { ...o, variant: 'info' }) };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map(({ id, message, variant, action }) => {
          const meta = VARIANT_META[variant] || VARIANT_META.info;
          const Icon = meta.icon;
          return (
            <div key={id} className={`toast ${meta.className}`} role={meta.role}>
              <Icon size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
              <span className="toast-message">{message}</span>
              {action && (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => { action.onClick(); dismiss(id); }}
                >
                  {action.label}
                </button>
              )}
              <button type="button" className="toast-close" onClick={() => dismiss(id)} aria-label="Dismiss notification">
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
