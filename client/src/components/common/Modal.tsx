import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ margin: 0 }}
    >
      {/* Soft, premium, glassmorphic backdrop overlay */}
      <div
        className="fixed inset-0 w-full h-full bg-[#1A2533]/25 backdrop-blur-[5px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={`relative z-10 bg-white rounded-2xl border border-[#EAE4D8]/80 w-full ${maxWidth} p-6 sm:p-7 shadow-[0_20px_50px_rgba(26,37,51,0.15)] animate-in fade-in zoom-in-95 duration-150`}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between pb-3.5 mb-4 border-b border-[#F0EBE1]">
            <div>
              {title && (
                <h3 className="font-serif font-bold text-lg text-[#1A2533] leading-snug">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#7A8696] mt-0.5 leading-normal">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 -mr-1 -mt-1 text-[#8E9AAB] hover:text-[#1A2533] hover:bg-[#F2ECE1]/60 rounded-md transition"
              title="Close modal"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body
  );
};
