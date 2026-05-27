import { cn } from '../../utils/cn';

interface Props {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
  variant?: 'default' | 'danger' | 'special';
  className?: string;
}

export function ActionButton({ label, onClick, disabled = false, hint, variant = 'default', className }: Props) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-full text-left px-3 py-2 text-sm border transition-all duration-150 focus:outline-none',
          variant === 'default' && !disabled && 'border-gold/40 text-ink hover:border-gold hover:text-gold hover:shadow-[0_0_8px_rgba(201,168,76,0.3)] cursor-pointer',
          variant === 'danger' && !disabled && 'border-blood/40 text-blood/80 hover:border-blood hover:text-blood cursor-pointer',
          variant === 'special' && !disabled && 'border-gold/60 text-gold hover:border-gold hover:shadow-[0_0_12px_rgba(201,168,76,0.5)] cursor-pointer',
          disabled && 'border-ink/10 text-ink/30 cursor-not-allowed',
          className,
        )}
      >
        {label}
      </button>
      {disabled && hint && (
        <div className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-paper border border-gold/20 text-ink/60 whitespace-nowrap z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {hint}
        </div>
      )}
    </div>
  );
}
