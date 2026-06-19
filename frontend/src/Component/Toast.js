import React, { createContext, useContext, useState, useCallback } from 'react';
import '../Style/Toast.css';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, removing: false }]);
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => t.id === id ? { ...t, removing: true } : t)
      );
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 350);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev =>
      prev.map(t => t.id === id ? { ...t, removing: true } : t)
    );
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 350);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type} ${toast.removing ? 'toast--removing' : ''}`}
          >
            <span className="toast__icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error'   && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info'    && 'ℹ'}
            </span>
            <span className="toast__message">{toast.message}</span>
            <button
              className="toast__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
