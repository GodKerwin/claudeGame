interface Props {
  label: string;
}

export function DiamondDivider({ label }: Props) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 h-px bg-gold/10" />
      <div
        className="w-[5px] h-[5px] bg-gold/40 shrink-0"
        style={{ transform: 'rotate(45deg)' }}
      />
      <span className="text-gold/40 text-[10px] tracking-[0.25em] shrink-0">{label}</span>
      <div
        className="w-[5px] h-[5px] bg-gold/40 shrink-0"
        style={{ transform: 'rotate(45deg)' }}
      />
      <div className="flex-1 h-px bg-gold/10" />
    </div>
  );
}
