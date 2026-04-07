import React from 'react';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function BaseModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  children,
  maxWidth = 'max-w-lg',
}: BaseModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className={`relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[85vh] overflow-hidden flex flex-col animate-[fadeIn_0.2s_ease-out]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {icon}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-headline font-bold text-lg text-primary">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-outline"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-outline-variant/20 shrink-0 flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
