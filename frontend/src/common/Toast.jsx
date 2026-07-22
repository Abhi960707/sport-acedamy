import React, { createContext, useContext, useState, useCallback } from 'react';

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

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/30';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/30';
      case 'info':
      default:
        return 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/10 dark:text-sky-400 dark:border-sky-900/30';
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-100 text-emerald-600';
      case 'error':
        return 'bg-rose-100 text-rose-600';
      case 'warning':
        return 'bg-amber-100 text-amber-600';
      case 'info':
      default:
        return 'bg-sky-100 text-sky-600';
    }
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-[380px] w-[calc(100vw-48px)] pointer-events-none" aria-live="polite">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 pr-3 rounded-xl border pointer-events-auto shadow-lg backdrop-blur-md font-medium text-sm transition-all duration-300 ${getTypeStyles(toast.type)} ${
              toast.removing ? 'animate-slide-out' : 'animate-slide-in'
            }`}
          >
            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${getIconBg(toast.type)}`}>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error'   && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info'    && 'ℹ'}
            </span>
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              className="text-lg leading-none opacity-60 hover:opacity-100 p-1 shrink-0 transition-opacity duration-150"
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
