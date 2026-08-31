import { useEffect, type ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'modal' | 'bottom-sheet';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  variant = 'modal',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-[420px]',
    md: 'max-w-[540px]',
    lg: 'max-w-[680px]',
    xl: 'max-w-[840px]',
    '2xl': 'max-w-[1000px]',
  }[maxWidth];

  const isBottomSheet = variant === 'bottom-sheet';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal Dialog'}
      className={`fixed inset-0 z-50 flex ${
        isBottomSheet
          ? 'items-end sm:items-center justify-center p-0 sm:p-6'
          : 'items-center justify-center p-4 sm:p-6'
      } overflow-hidden`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidthStyles} bg-[#141416]/95 border border-white/10 ${
          isBottomSheet
            ? 'rounded-t-[28px] sm:rounded-3xl border-x-0 sm:border-x border-b-0 sm:border-b p-5 sm:p-8 max-h-[85dvh] sm:max-h-[calc(100dvh-48px)] pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-8 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95'
            : 'rounded-3xl p-6 sm:p-8 max-h-[calc(100dvh-48px)] animate-in fade-in zoom-in-95'
        } shadow-2xl z-10 flex flex-col overflow-hidden duration-200 min-w-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull/Drag Handle */}
        {isBottomSheet && (
          <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-3 sm:hidden flex-shrink-0" />
        )}

        {title && (
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3.5 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 custom-scrollbar min-w-0 pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
