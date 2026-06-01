import { cn } from '../../utils/cn';

interface Props {
  label: string;
  value: number;
  max?: number;
  className?: string;
}

const STAT_LABELS: Record<string, string> = {
  strength: '力量',
  agility: '敏捷',
  wisdom: '智慧',
  constitution: '根骨',
};

export function StatBar({ label, value, max = 10, className }: Props) {
  const displayLabel = STAT_LABELS[label] ?? label;
  const fillPercent = Math.min(100, (value / max) * 100);
  const isHigh = value >= 7;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="w-8 text-ink/50 text-xs shrink-0">{displayLabel}</span>
      <div className="flex-1 h-1.5 bg-gold/8 rounded-full overflow-hidden relative">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isHigh ? 'bg-gold/75' : 'bg-gold/45',
          )}
          style={{
            width: `${fillPercent}%`,
            boxShadow: isHigh ? '0 0 6px rgba(201,168,76,0.4)' : 'none',
          }}
        />
      </div>
      <span className={cn('w-4 text-right text-xs font-bold shrink-0', isHigh ? 'text-gold' : 'text-gold/60')}>
        {value}
      </span>
    </div>
  );
}
