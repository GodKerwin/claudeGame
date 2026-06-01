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
          'w-full text-left px-3 py-1.5 text-sm border transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/40 relative overflow-hidden',
          variant === 'default' && !isDisabled && [
            'border-gold/25 text-ink/80 cursor-pointer',
            'hover:border-gold/55 hover:text-ink',
          ],
          variant === 'danger' && !isDisabled && 'border-blood/35 text-blood/75 hover:border-blood/60 hover:text-blood cursor-pointer',
          variant === 'special' && !isDisabled && 'border-gold/50 text-gold/85 hover:border-gold hover:text-gold cursor-pointer',
          completed && 'border-gold/10 text-ink/20 cursor-not-allowed',
          !completed && disabled && 'border-ink/8 text-ink/25 cursor-not-allowed',
          className,
        )}
      >
        {/* 悬停时的左侧微光条 */}
        {!isDisabled && variant === 'default' && (
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold/0 group-hover:bg-gold/40 transition-all duration-150 rounded-r-full" />
        )}
        {completed ? (
          <span className="text-gold/20">✓ {label}</span>
        ) : (
          <span className="pl-0.5">{label}</span>
        )}
      </button>
      {!completed && disabled && hint && hoverRect && (
        <div
          className="fixed z-50 px-2.5 py-1.5 text-xs bg-paper-mid border border-gold/20 text-ink/55 whitespace-nowrap pointer-events-none shadow-lg"
          style={{ bottom: window.innerHeight - hoverRect.top + 6, left: hoverRect.left }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
