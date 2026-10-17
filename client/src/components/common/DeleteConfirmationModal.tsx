import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, Check } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  itemType?: string;
  warningMessage?: string;
  details?: { label: string; value: string | number }[];
  requireTypingName?: boolean;
  isDeleting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  itemName,
  itemType = 'company workspace',
  warningMessage,
  details = [],
  requireTypingName = true,
  isDeleting = false,
  errorMessage = null,
  onConfirm,
  onClose,
}) => {
  const [typedConfirm, setTypedConfirm] = useState('');

  // Reset typed input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTypedConfirm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatch = !requireTypingName || typedConfirm.trim().toLowerCase() === itemName.trim().toLowerCase();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isDeleting) {
      onClose();
    } else if (e.key === 'Enter' && isMatch && !isDeleting) {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/80">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {title || `Delete ${itemType}`}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This is a permanent destructive action and cannot be undone.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 space-y-4">
          {/* Danger Warning Box */}
          <div className="p-3.5 bg-rose-50/80 border border-rose-200/80 rounded-xl text-xs text-rose-800 leading-relaxed space-y-1">
            <div className="font-semibold text-rose-900 flex items-center gap-1.5">
              <span>⚠️ Permanent Deletion Notice</span>
            </div>
            <p>
              {warningMessage || (
                <>
                  You are about to permanently delete <strong>{itemName}</strong>. All associated records, active contracts, assigned employee capacity, and historical audit logs will be permanently wiped.
                </>
              )}
            </p>
          </div>

          {/* Item details summary */}
          {details.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs divide-y divide-slate-100">
              {details.map((d, idx) => (
                <div key={idx} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <span className="text-slate-500">{d.label}</span>
                  <span className="font-semibold text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Typing confirmation safety check */}
          {requireTypingName && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                To confirm deletion, please type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">{itemName}</span> below:
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={typedConfirm}
                  onChange={(e) => setTypedConfirm(e.target.value)}
                  placeholder={`Type "${itemName}" to confirm`}
                  disabled={isDeleting}
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white focus:outline-none transition ${
                    isMatch && typedConfirm
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-900 pr-8'
                      : 'border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-slate-800'
                  }`}
                />
                {isMatch && typedConfirm && (
                  <Check className="w-4 h-4 text-emerald-600 absolute right-2.5 top-2.5" />
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-100/80 border border-rose-300 rounded-lg text-xs font-medium text-rose-700">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-5 mt-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!isMatch || isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
