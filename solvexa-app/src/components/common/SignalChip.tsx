import { useState, useRef, useEffect } from 'react';
import { SIGNAL_TYPE_CONFIG, type SignalType } from '../../types/post.types';

interface SignalChipProps {
  activeSignal?: SignalType | null;
  count: number;
  onSelectSignal: (type: SignalType) => void;
  className?: string;
}

export function SignalChip({
  activeSignal,
  count,
  onSelectSignal,
  className = '',
}: SignalChipProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const activeConfig = activeSignal ? SIGNAL_TYPE_CONFIG[activeSignal] : null;

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={pickerRef}>
      <button
        onClick={() => {
          if (activeSignal) {
            onSelectSignal(activeSignal); // toggles off
          } else {
            setShowPicker(!showPicker);
          }
        }}
        onMouseEnter={() => setShowPicker(true)}
        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
          activeConfig
            ? 'bg-primary/15 border-primary text-primary shadow-[0_0_12px_rgba(208,188,255,0.25)]'
            : 'bg-white/5 border-white/10 text-on-surface-variant hover:border-white/20 hover:text-on-surface'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[18px] transition-transform group-hover:scale-110 ${
            activeConfig ? 'icon-filled text-primary animate-pulse' : 'text-on-surface-variant'
          }`}
        >
          {activeConfig ? activeConfig.icon : 'sensors'}
        </span>
        <span>{count > 0 ? count : 'Signal'}</span>
      </button>

      {/* Floating Signal Selector with 6 Types */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-[#141416]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl flex items-center gap-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {(Object.keys(SIGNAL_TYPE_CONFIG) as SignalType[]).map((type) => {
            const config = SIGNAL_TYPE_CONFIG[type];
            const isSelected = activeSignal === type;
            return (
              <button
                key={type}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSignal(type);
                  setShowPicker(false);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-150 group hover:scale-115 ${
                  isSelected ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
                title={`${config.label}: ${config.description}`}
              >
                <span
                  className="material-symbols-outlined text-[20px] transition-colors"
                  style={{ color: config.color }}
                >
                  {config.icon}
                </span>
                <span className="text-[9px] font-semibold text-zinc-400 mt-0.5 group-hover:text-white">
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
