import { useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface Props {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  completed?: boolean;
  hint?: string;
  variant?: 'default' | 'danger' | 'special';
  className?: string;
}

export function ActionButton({ label, onClick, disabled = false, completed = false, hint, variant = 'default', className }: Props) {
  const isDisabled = disabled || completed;
  const ref = useRef<HTMLDivElement>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  return (
    <div
      ref={ref}
      className="relative group"
      onMouseEnter={() => { if (ref.current) setHoverRect(ref.current.getBoundingClientRect()); }}
      onMouseLeave={() => setHoverRect(null)}
    >
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          'w-full text-left px-3 py-2 text-sm border transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/50',
          variant === 'default' && !isDisabled && 'border-gold/40 text-ink hover:border-gold hover:text-gold hover:shadow-[0_0_8px_rgba(201,168,76,0.3)] cursor-pointer',
          variant === 'danger' && !isDisabled && 'border-blood/40 text-blood/80 hover:border-blood hover:text-blood cursor-pointer',
          variant === 'special' && !isDisabled && 'border-gold/60 text-gold hover:border-gold hover:shadow-[0_0_12px_rgba(201,168,76,0.5)] cursor-pointer',
          completed && 'border-gold/15 text-ink/25 cursor-not-allowed',
          !completed && disabled && 'border-ink/10 text-ink/30 cursor-not-allowed',
          className,
        )}
      >
        {completed ? <span className="text-gold/30">✓ {label}</span> : label}
      </button>
      {!completed && disabled && hint && hoverRect && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-paper border border-gold/20 text-ink/60 whitespace-nowrap pointer-events-none shadow-sm"
          style={{ bottom: window.innerHeight - hoverRect.top + 4, left: hoverRect.left }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
