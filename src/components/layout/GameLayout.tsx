interface Props {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function GameLayout({ left, center, right }: Props) {
  return (
    <div className="flex h-screen w-screen bg-paper text-ink font-serif overflow-hidden select-none">
      <div className="w-40 shrink-0 panel border-r border-gold/20 flex flex-col overflow-hidden">
        {left}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gold/20">
        {center}
      </div>
      <div className="shrink-0 panel flex flex-col overflow-hidden" style={{ width: '200px' }}>
        {right}
      </div>
    </div>
  );
}
