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

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="w-8 text-ink/70 shrink-0">{displayLabel}</span>
      <div className="flex-1 h-2 bg-paper border border-gold/20 rounded-sm overflow-hidden">
        <div
          className="h-full bg-gold/70 rounded-sm transition-all duration-300"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <span className="w-4 text-right text-gold font-bold">{value}</span>
    </div>
  );
}
