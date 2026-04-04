import React from 'react';

interface AiPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  approveLabel?: string;
  rejectLabel?: string;
  approveDisabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  footerNote?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function AiPreviewModal({
  open,
  onClose,
  title,
  icon,
  onApprove,
  onReject,
  approveLabel = 'Duyệt và lưu',
  rejectLabel = 'Hủy',
  approveDisabled = false,
  loading = false,
  loadingLabel = 'Đang xử lý...',
  footerNote,
  children,
  maxWidth = 'max-w-3xl',
}: AiPreviewModalProps) {
  if (!open) return null;

  const handleApprove = async () => {
    try { await onApprove(); } catch { /* handled by component */ }
  };
  const handleReject = async () => {
    try { await onReject(); } catch { /* handled by component */ }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className={`relative z-[10000] bg-surface-container-lowest rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-[fadeIn_0.2s_ease-out]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <h3 className="font-headline font-bold text-lg text-primary">{title}</h3>
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
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low/30 rounded-b-2xl">
          {footerNote && (
            <p className="text-xs text-outline mb-3 flex items-start gap-1.5">
              <span className="material-symbols-outlined text-sm text-secondary flex-shrink-0 mt-0.5">info</span>
              {footerNote}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-surface-container-low rounded-lg transition-colors disabled:opacity-50"
            >
              {rejectLabel}
            </button>
            <button
              onClick={handleApprove}
              disabled={approveDisabled || loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  {loadingLabel}
                </>
              ) : (
                <>
                  {approveLabel}
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
