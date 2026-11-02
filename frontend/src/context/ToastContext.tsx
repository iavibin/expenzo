import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        dismissToast(id);
      }, 4000);
    },
    [dismissToast]
  );

  const showSuccess = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const showInfo = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
  const showWarning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showInfo, showWarning, dismissToast }}
    >
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg bg-foundation-surface transition-all duration-200 ${
                isSuccess
                  ? 'border-emerald-500/30 text-gray-200'
                  : isError
                  ? 'border-rose-500/30 text-gray-200'
                  : isWarning
                  ? 'border-amber-500/30 text-gray-200'
                  : 'border-foundation-border text-gray-200'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-semantic-emerald shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-4 h-4 text-semantic-rose shrink-0 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-semantic-amber shrink-0 mt-0.5" />}
              {!isSuccess && !isError && !isWarning && (
                <Info className="w-4 h-4 text-brand-tealLight shrink-0 mt-0.5" />
              )}

              <div className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
                title="Dismiss"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
