import { useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, Loader2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-md bg-foundation-surface border border-foundation-border rounded-xl p-6 shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : isWarning
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-brand-teal/10 text-brand-tealLight border border-brand-teal/20'
              }`}
            >
              {isDanger ? (
                <AlertTriangle className="w-4 h-4" />
              ) : isWarning ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-base font-semibold text-white tracking-tight">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-foundation-surfaceElevated transition-colors disabled:opacity-50"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-300 leading-relaxed">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-foundation-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-foundation-surfaceElevated hover:bg-[#222e40] border border-foundation-borderSubtle text-gray-300 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer ${
              isDanger
                ? 'bg-semantic-rose hover:bg-rose-600'
                : isWarning
                ? 'bg-semantic-amber hover:bg-amber-600'
                : 'bg-brand-teal hover:bg-brand-tealLight'
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
